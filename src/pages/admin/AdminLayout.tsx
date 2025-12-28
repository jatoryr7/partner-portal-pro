import { useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, TrendingUp, Package, Users, BarChart3, Activity, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CommandPalette, CommandPaletteTrigger } from '@/components/admin/CommandPalette';
import { QuickActionsFAB } from '@/components/admin/QuickActionsFAB';
import { PortalMapMenu, PortalMapTrigger } from '@/components/admin/PortalMapMenu';
import { RoleQuickSwitcher, type ViewRole, getRoleConfig } from '@/components/admin/RoleQuickSwitcher';
import { SessionMonitor } from '@/components/admin/SessionMonitor';
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
  
  const [isPortalMapOpen, setIsPortalMapOpen] = useState(false);
  const [activeViewRole, setActiveViewRole] = useState<ViewRole | null>(null);
  
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

  // Filter workspaces based on active role
  const roleConfig = getRoleConfig(activeViewRole);
  const visibleWorkspaces = roleConfig
    ? workspaces.filter(ws => roleConfig.visibleWorkspaces.includes(ws.id))
    : workspaces;

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Top Header Navigation Bar */}
      <header className="h-16 border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
          {/* Logo, Brand & Portal Map */}
          <div className="flex items-center gap-4">
            <PortalMapTrigger onClick={() => setIsPortalMapOpen(true)} />
            
            <div className="h-8 w-px bg-border hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-none bg-gradient-to-br from-primary to-healthcare-teal">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold tracking-scientific text-foreground">Command Center</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Healthcare Analytics</p>
              </div>
            </div>
          </div>

          {/* Workspace Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-none">
            {visibleWorkspaces.map((ws) => {
              const Icon = ws.icon;
              const isActive = activeWorkspace === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleWorkspaceChange(ws.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-none",
                    isActive
                      ? "bg-card text-foreground shadow-sm border-b-2 border-primary"
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
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/settings')}
              className="text-muted-foreground hover:text-foreground rounded-none"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAsPartner}
              className="hidden sm:flex rounded-none"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive rounded-none"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Role Quick Switcher Bar */}
      <RoleQuickSwitcher 
        activeRole={activeViewRole} 
        onRoleChange={setActiveViewRole} 
      />

      {/* Mobile Workspace Navigation */}
      <nav className="md:hidden flex items-center gap-1 p-2 bg-card border-b border-border overflow-x-auto">
        {visibleWorkspaces.map((ws) => {
          const Icon = ws.icon;
          const isActive = activeWorkspace === ws.id;
          return (
            <button
              key={ws.id}
              onClick={() => handleWorkspaceChange(ws.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-none whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
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
          <Outlet context={{ activeViewRole }} />
        </div>
      </main>

      {/* Portal Map Menu */}
      <PortalMapMenu 
        isOpen={isPortalMapOpen} 
        onClose={() => setIsPortalMapOpen(false)} 
      />

      {/* Global Command Palette */}
      <CommandPalette />
      
      {/* Global Quick Actions FAB */}
      <QuickActionsFAB />
      
      {/* Session Monitor */}
      <SessionMonitor />
    </div>
  );
}
