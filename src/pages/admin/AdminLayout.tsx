import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CommandPalette, CommandPaletteTrigger } from '@/components/admin/CommandPalette';
import { QuickActionsFAB } from '@/components/admin/QuickActionsFAB';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleViewAsPartner = () => {
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
          {/* Header with persistent Command+K search */}
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="mr-2" />
              <h2 className="font-semibold text-foreground hidden sm:block">Command Center</h2>
              {/* Global Command+K Search - Always Visible */}
              <CommandPaletteTrigger />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAsPartner}
                className="text-muted-foreground hover:text-foreground hidden sm:flex"
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
        {/* Global Command Palette */}
        <CommandPalette />
        {/* Global Quick Actions FAB */}
        <QuickActionsFAB />
      </div>
    </SidebarProvider>
  );
}
