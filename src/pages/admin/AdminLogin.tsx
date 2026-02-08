import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const AdminLogin = React.forwardRef<HTMLDivElement>(function AdminLogin(_props, _ref) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const fromRaw = (location.state as any)?.from?.pathname;
  const from =
    typeof fromRaw === 'string' && fromRaw.startsWith('/admin') && fromRaw !== '/admin/login'
      ? fromRaw
      : '/admin';

  console.log('[AdminLogin] Render:', {
    loading,
    user: user ? { id: user.id, email: user.email } : null,
    roles,
    from,
  });

  if (loading) {
    console.log('[AdminLogin] ⏳ Auth loading — showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && roles.includes('admin')) {
    console.log('[AdminLogin] ✅ Already admin — redirecting to', from);
    return <Navigate to={from} replace />;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
    }
    try { passwordSchema.parse(password); } catch (e) {
      if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    console.log('[AdminLogin] 🔐 Login form submitted', { email });
    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      console.log('[AdminLogin] ✅ Supabase signIn success — checking roles');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        console.log('[AdminLogin] Fetched roles:', userRoles);
        const hasAdminRole = userRoles?.some(r => r.role === 'admin');
        
        if (!hasAdminRole) {
          console.log('[AdminLogin] ❌ No admin role — signing out');
          toast({
            title: 'Access Denied',
            description: 'This login is for administrators only.',
            variant: 'destructive',
          });
          await supabase.auth.signOut();
        } else {
          console.log('[AdminLogin] ✅ Admin confirmed — navigating to', from);
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });
          navigate(from, { replace: true });
          console.log('[AdminLogin] 🚀 navigate() called');
        }
      } else {
        console.log('[AdminLogin] ⚠️ getUser returned null after signIn');
      }
    }
    setIsLoading(false);
    console.log('[AdminLogin] handleSignIn complete');
  };

  const handleHardReset = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | Partner Portal</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md rounded-none border-border">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-[#1ABC9C]" />
              <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            </div>
            <CardDescription>
              Sign in to access the Command Center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none"
                  disabled={isLoading}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-none"
                  disabled={isLoading}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <Button
                type="submit"
                className="w-full rounded-none bg-[#1ABC9C] hover:bg-[#16A085] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Public Directory
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <button
        onClick={handleHardReset}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 9999,
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        ⚠️ Hard Reset App
      </button>
    </>
  );
});

export default AdminLogin;
