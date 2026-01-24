import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'partner';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, roles, activeRole, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user has multiple roles but hasn't selected one, redirect to role selector
  if (roles.length > 1 && !activeRole) {
    return <Navigate to="/" replace />;
  }

  // Allow admins to preview partner portal
  if (requiredRole === 'partner' && roles.includes('admin') && isPreviewMode) {
    return <>{children}</>;
  }

  // Check if user has the required role
  if (requiredRole && !roles.includes(requiredRole)) {
    // Redirect based on what roles they have
    if (roles.includes('admin')) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/partner" replace />;
  }

  // Check if user is trying to access a route that doesn't match their active role
  if (requiredRole && activeRole && requiredRole !== activeRole) {
    // They have the role but it's not their active selection - allow but they might want to switch
    // For now, allow access if they have the role
  }

  return <>{children}</>;
}
