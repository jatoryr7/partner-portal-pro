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

  console.log('[ProtectedRoute] Guard Check:', {
    loading,
    user: user ? { id: user.id, email: user.email } : null,
    roles,
    activeRole,
    requiredRole,
    path: location.pathname,
    isPreviewMode,
  });

  // Critical: while loading, only show spinner — never redirect (prevents auth redirect loops)
  if (loading) {
    console.log('[ProtectedRoute] ⏳ Still loading auth — showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/partner/login';
    console.log('[ProtectedRoute] ❌ No user — redirecting to', loginPath);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole && roles.includes(requiredRole)) {
    console.log('[ProtectedRoute] ✅ User has required role — rendering children');
    return <>{children}</>;
  }

  if (requiredRole && roles.length === 0) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/partner/login';
    console.log('[ProtectedRoute] ⚠️ Roles empty — redirecting to', loginPath);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole === 'partner' && roles.includes('admin') && isPreviewMode) {
    console.log('[ProtectedRoute] ✅ Admin preview mode — rendering children');
    return <>{children}</>;
  }

  if (requiredRole) {
    if (roles.includes('admin')) {
      console.log('[ProtectedRoute] 🔀 Wrong role — redirecting to /admin');
      return <Navigate to="/admin" replace />;
    }
    if (roles.includes('partner')) {
      console.log('[ProtectedRoute] 🔀 Wrong role — redirecting to /partner');
      return <Navigate to="/partner" replace />;
    }
  }

  if (roles.length > 1 && !activeRole) {
    console.log('[ProtectedRoute] 🔀 Multi-role, no active — redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] ✅ Default — rendering children');
  return <>{children}</>;
}
