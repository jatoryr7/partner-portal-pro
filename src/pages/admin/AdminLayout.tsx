import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Activity, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CommandPalette, CommandPaletteTrigger } from '@/components/admin/CommandPalette';
import { QuickActionsFAB } from '@/components/admin/QuickActionsFAB';
import { PortalMapMenu, PortalMapTrigger } from '@/components/admin/PortalMapMenu';
import { SmartSelector, type ViewRole, type Workspace, getRoleConfig } from '@/components/admin/SmartSelector';
import { SessionMonitor } from '@/components/admin/SessionMonitor';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signOut } = useAuth();
  
  const [isPortalMapOpen, setIsPortalMapOpen] = useState(false);
  const [activeViewRole, setActiveViewRole] = useState<ViewRole | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<string>('pacing');
  
  const activeWorkspace = (searchParams.get('workspace') as Workspace) || 'sales_bd';

  // Auto-navigate to correct sub-tab when role changes
  useEffect(() => {
    const roleConfig = getRoleConfig(activeViewRole);
    if (roleConfig?.defaultSubTab) {
      setActiveSubTab(roleConfig.defaultSubTab);
    }
  }, [activeViewRole]);

  const handleWorkspaceChange = (workspace: Workspace) => {
    setSearchParams({ workspace });
  };

  const handleRoleChange = (role: ViewRole | null) => {
    setActiveViewRole(role);
    
    if (role) {
      const config = getRoleConfig(role);
      if (config) {
        // Auto-navigate to the role's default workspace
        setSearchParams({ workspace: config.defaultWorkspace });
      }
    }
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

      {/* Smart Selector - Merged Role + Workspace Navigation */}
      <SmartSelector 
        activeRole={activeViewRole} 
        onRoleChange={handleRoleChange}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onSubTabChange={setActiveSubTab}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1800px] mx-auto">
          <Outlet context={{ activeViewRole, activeSubTab, setActiveSubTab }} />
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
