import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSelector } from '@/components/RoleSelector';
import { Loader2 } from 'lucide-react';

export default function RoleRouter() {
  const { user, roles, activeRole, loading, setActiveRole } = useAuth();

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

  // If user has multiple roles and hasn't selected one yet, show the selector
  if (roles.length > 1 && !activeRole) {
    return <RoleSelector roles={roles} onSelect={setActiveRole} />;
  }

  // Route based on active role
  if (activeRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/partner" replace />;
}
