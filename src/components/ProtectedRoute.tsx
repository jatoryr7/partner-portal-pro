import { Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'partner';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, roles, activeRole, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isPreviewMode = searchParams.get('preview') === 'true';

  // Critical: while loading, only show spinner — never redirect (prevents auth redirect loops)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // No session: redirect to role-specific login (e.g. /admin -> /admin/login)
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/partner/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If user has the required role, always allow access (render children). Never redirect to /.
  if (requiredRole && roles.includes(requiredRole)) {
    return <>{children}</>;
  }

  // Roles not yet loaded or empty: redirect to login so they can re-auth
  if (requiredRole && roles.length === 0) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/partner/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Allow admins to preview partner portal
  if (requiredRole === 'partner' && roles.includes('admin') && isPreviewMode) {
    return <>{children}</>;
  }

  // User lacks required role: redirect to their zone (admin -> /admin, partner -> /partner)
  if (requiredRole) {
    if (roles.includes('admin')) {
      return <Navigate to="/admin" replace />;
    }
    if (roles.includes('partner')) {
      return <Navigate to="/partner" replace />;
    }
  }

  // Multi-role user without activeRole and not hitting a role-specific route: show role selector at /
  if (roles.length > 1 && !activeRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
