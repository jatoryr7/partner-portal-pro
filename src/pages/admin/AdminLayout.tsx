import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Search, TrendingUp, Package, Users, BarChart3, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CommandPalette, CommandPaletteTrigger } from '@/components/admin/CommandPalette';
import { QuickActionsFAB } from '@/components/admin/QuickActionsFAB';
import { cn } from '@/lib/utils';

type Workspace = 'sales_bd' | 'operations' | 'inventory' | 'partner_success';

const workspaces: { id: Workspace; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sales_bd', label: 'Sales', icon: TrendingUp },
  { id: 'operations', label: 'Operations', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'partner_success', label: 'Success', icon: Users },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signOut } = useAuth();
  
  const activeWorkspace = (searchParams.get('workspace') as Workspace) || 'sales_bd';

  const handleWorkspaceChange = (workspace: Workspace) => {
    setSearchParams({ workspace });
  };

  const handleViewAsPartner = () => {
    navigate('/partner?preview=true');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Top Header Navigation Bar */}
      <header className="h-16 border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-sm bg-gradient-to-br from-primary to-healthcare-teal">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold tracking-scientific text-foreground">Command Center</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Healthcare Analytics</p>
            </div>
          </div>

          {/* Workspace Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-sm">
            {workspaces.map((ws) => {
              const Icon = ws.icon;
              const isActive = activeWorkspace === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleWorkspaceChange(ws.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-sm",
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{ws.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Global Search & Actions */}
          <div className="flex items-center gap-3">
            <CommandPaletteTrigger />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAsPartner}
              className="hidden sm:flex"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Workspace Navigation */}
      <nav className="md:hidden flex items-center gap-1 p-2 bg-card border-b border-border overflow-x-auto">
        {workspaces.map((ws) => {
          const Icon = ws.icon;
          const isActive = activeWorkspace === ws.id;
          return (
            <button
              key={ws.id}
              onClick={() => handleWorkspaceChange(ws.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-sm whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{ws.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1800px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Global Command Palette */}
      <CommandPalette />
      
      {/* Global Quick Actions FAB */}
      <QuickActionsFAB />
    </div>
  );
}
