import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Activity, Settings, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { CommandPalette, CommandPaletteTrigger } from '@/components/admin/CommandPalette';
import { QuickActionsFAB } from '@/components/admin/QuickActionsFAB';
import { PortalMapMenu, PortalMapTrigger } from '@/components/admin/PortalMapMenu';
import { SmartSelector, type ViewRole, type Workspace, getRoleConfig, getVisibleSubTabs } from '@/components/admin/SmartSelector';
import { SessionMonitor } from '@/components/admin/SessionMonitor';

/** Path segment → breadcrumb label for admin routes. */
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Command Center',
  queue: 'Campaign Queue',
  stakeholders: 'Stakeholders',
  users: 'User Management',
  brands: 'Brand Directory',
  deals: 'Deals CRM',
  native: 'Native',
  'paid-social': 'Paid Social',
  media: 'Media',
  newsletter: 'Newsletter',
  'content-marketing': 'Content Marketing',
  settings: 'Settings',
  'external-hub': 'External Hub',
  'medical-review': 'Medical Integrity',
  analytics: 'Intelligence',
  finance: 'Financials',
  gateways: 'External Gateways',
  'internal-dashboard': 'Internal Dashboard',
  submission: 'Submission',
};

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) || /^[0-9a-f-]{20,}$/i.test(s);
}

function buildBreadcrumbs(pathname: string): { path: string; label: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { path: string; label: string }[] = [];
  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += (acc ? '/' : '') + seg;
    const label = SEGMENT_LABELS[seg] ?? (isUuidLike(seg) ? 'Review' : seg.replace(/-/g, ' '));
    crumbs.push({ path: '/' + acc, label });
  }
  return crumbs;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { signOut } = useAuth();
  
  const [isPortalMapOpen, setIsPortalMapOpen] = useState(false);
  const [activeViewRole, setActiveViewRole] = useState<ViewRole | null>(() => {
    const urlRole = searchParams.get('role') as ViewRole | null;
    return urlRole || null;
  });
  const [activeSubTab, setActiveSubTab] = useState<string>('pacing');
  
  const activeWorkspace = (searchParams.get('workspace') as Workspace) || 'sales_bd';

  // Calculate visible sub-tab count for UI reduction badge
  const visibleSubTabCount = useMemo(() => {
    return getVisibleSubTabs(activeViewRole).length;
  }, [activeViewRole]);

  // Auto-navigate to correct sub-tab when role changes
  useEffect(() => {
    const roleConfig = getRoleConfig(activeViewRole);
    if (roleConfig?.defaultSubTab) {
      setActiveSubTab(roleConfig.defaultSubTab);
    }
  }, [activeViewRole]);

  const handleWorkspaceChange = (workspace: Workspace) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('workspace', workspace);
    setSearchParams(newParams);
  };

  const handleRoleChange = (role: ViewRole | null) => {
    setActiveViewRole(role);
    
    if (role) {
      const config = getRoleConfig(role);
      if (config) {
        // Auto-navigate to the role's default workspace
        const newParams = new URLSearchParams(searchParams);
        newParams.set('workspace', config.defaultWorkspace);
        newParams.set('role', role);
        setSearchParams(newParams);
      }
    } else {
      // Clear role from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('role');
      setSearchParams(newParams);
    }
  };

  const handleViewAsPartner = () => {
    navigate('/partner?preview=true');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isAdminRoot = location.pathname === '/admin' || location.pathname === '/admin/';
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Top Header Navigation Bar */}
      <header className="h-16 border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
          {/* Navigation control group + Logo, Brand & Portal Map */}
          <div className="flex items-center gap-4 min-w-0">
            <PortalMapTrigger onClick={() => setIsPortalMapOpen(true)} />
            
            <div className="h-8 w-px bg-border hidden sm:block" />
            
            {/* Back / Forward / Breadcrumbs */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('size-9 rounded-none text-muted-foreground hover:text-[#1ABC9C] hover:bg-[#1ABC9C]/10', isAdminRoot && 'opacity-40 pointer-events-none')}
                  onClick={() => navigate(-1)}
                  disabled={isAdminRoot}
                  title="Back"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('size-9 rounded-none text-muted-foreground hover:text-[#1ABC9C] hover:bg-[#1ABC9C]/10', isAdminRoot && 'opacity-40 pointer-events-none')}
                  onClick={() => navigate(1)}
                  disabled={isAdminRoot}
                  title="Forward"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <nav className="flex items-center gap-1.5 min-w-0 truncate text-sm" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, i) => {
                  const isLast = i === breadcrumbs.length - 1;
                  return (
                    <span key={crumb.path} className="flex items-center gap-1.5 shrink-0">
                      {i > 0 && <span className="text-muted-foreground/60">›</span>}
                      {isLast ? (
                        <span className="font-medium text-foreground truncate">{crumb.label}</span>
                      ) : (
                        <Link
                          to={crumb.path}
                          className="text-muted-foreground hover:text-[#1ABC9C] truncate transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </span>
                  );
                })}
              </nav>
            </div>
            
            <div className="h-8 w-px bg-border hidden md:block shrink-0" />
            
            <div className="flex items-center gap-3 shrink-0">
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

      {/* Top Navigation Ribbon - Primary Navigation Items */}
      <nav className="border-b border-border bg-card/50">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex items-center gap-1 h-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/medical-review')}
              className={cn(
                "rounded-none h-9 px-4 gap-2",
                location.pathname === '/admin/medical-review'
                  ? "bg-[#1ABC9C]/10 text-[#1ABC9C] border-b-2 border-[#1ABC9C] font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4" />
              Medical Review
            </Button>
          </div>
        </div>
      </nav>

      {/* Smart Selector - Merged Role + Workspace Navigation */}
      <SmartSelector 
        activeRole={activeViewRole} 
        onRoleChange={handleRoleChange}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onSubTabChange={setActiveSubTab}
        visibleSubTabCount={visibleSubTabCount}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1800px] mx-auto">
          <Outlet context={{ activeViewRole, activeSubTab, setActiveSubTab, activeWorkspace }} />
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