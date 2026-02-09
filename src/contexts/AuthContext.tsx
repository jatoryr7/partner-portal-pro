import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'partner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setActiveRole: (role: AppRole) => void;
  // Keep 'role' for backward compatibility
  role: AppRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async (userId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (data && !error && data.length > 0) {
      const userRoles = data.map(r => r.role as AppRole);
      setRoles(userRoles);
      
      // Check if there's a stored preference
      const storedRole = localStorage.getItem('activeRole') as AppRole | null;
      if (storedRole && userRoles.includes(storedRole)) {
        setActiveRole(storedRole);
      } else if (userRoles.length === 1) {
        // Auto-select if only one role
        setActiveRole(userRoles[0]);
      }
      // If multiple roles and no stored preference, activeRole stays null (will show selector)
    } else {
      setRoles(['partner']); // Default to partner if no role found
      setActiveRole('partner');
    }
  };

  const handleSetActiveRole = (role: AppRole) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRoles(session.user.id);
        } else {
          setRoles([]);
          setActiveRole(null);
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRoles(session.user.id);
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    localStorage.removeItem('activeRole');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setActiveRole(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      roles,
      activeRole,
      loading, 
      signIn, 
      signUp, 
      signOut,
      setActiveRole: handleSetActiveRole,
      // Backward compatibility
      role: activeRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
