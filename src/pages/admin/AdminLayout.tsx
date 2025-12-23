import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleViewAsPartner = () => {
    // Navigate to partner view for admin preview
    navigate('/partner?preview=true');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h2 className="font-semibold text-foreground">Internal Dashboard</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAsPartner}
                className="text-muted-foreground hover:text-foreground"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Portal as User
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
