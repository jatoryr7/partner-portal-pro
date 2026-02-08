import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Crown, LineChart, Calculator, Stethoscope, 
  ChevronDown, Check, Home, TrendingUp, BarChart3,
  Package, Users, Megaphone, Scale, Palette, Eye, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ViewRole = 'executive' | 'analyst' | 'accounting' | 'medical';
export type Workspace = 'sales_bd' | 'operations' | 'inventory' | 'partner_success' | 'marketing' | 'legal' | 'creative';

interface RoleConfig {
  id: ViewRole;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  visibleWorkspaces: Workspace[];
  defaultWorkspace: Workspace;
  defaultSubTab?: string;
  focusAreas: string[];
  breadcrumbPath: string[];
}

interface WorkspaceConfig {
  id: Workspace;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const roleConfigs: RoleConfig[] = [
  {
    id: 'executive',
    label: 'Executive View',
    shortLabel: 'Executive',
    icon: Crown,
    description: 'Universal access - all workspaces',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    visibleWorkspaces: ['sales_bd', 'operations', 'inventory', 'partner_success', 'marketing', 'legal', 'creative'],
    defaultWorkspace: 'sales_bd',
    focusAreas: ['revenue', 'pipeline', 'growth'],
    breadcrumbPath: ['Portal Map', 'Executive Overview'],
  },
  {
    id: 'analyst',
    label: 'Analyst View',
    shortLabel: 'Analyst',
    icon: LineChart,
    description: 'Operations & Inventory focus',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    visibleWorkspaces: ['operations', 'inventory'],
    defaultWorkspace: 'operations',
    defaultSubTab: 'intelligence',
    focusAreas: ['metrics', 'trends', 'reports'],
    breadcrumbPath: ['Portal Map', 'Analytics', 'Intelligence'],
  },
  {
    id: 'accounting',
    label: 'Accounting View',
    shortLabel: 'Accounting',
    icon: Calculator,
    description: 'Billables only - streamlined',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    visibleWorkspaces: ['operations'],
    defaultWorkspace: 'operations',
    defaultSubTab: 'billables',
    focusAreas: ['billables', 'reconciliation', 'disputes'],
    breadcrumbPath: ['Portal Map', 'Financials', 'Billables'],
  },
  {
    id: 'medical',
    label: 'Medical Reviewer',
    shortLabel: 'Medical',
    icon: Stethoscope,
    description: 'Medical reviews only',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    visibleWorkspaces: ['operations'],
    defaultWorkspace: 'operations',
    defaultSubTab: 'medical',
    focusAreas: ['medical', 'compliance', 'standards'],
    breadcrumbPath: ['Portal Map', 'Compliance', 'Medical Review'],
  },
];

export const workspaceConfigs: WorkspaceConfig[] = [
  { id: 'sales_bd', label: 'Sales / BD', icon: TrendingUp, color: 'text-emerald-500' },
  { id: 'operations', label: 'Operations', icon: BarChart3, color: 'text-orange-500' },
  { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-teal-500' },
  { id: 'partner_success', label: 'Partner Success', icon: Users, color: 'text-cyan-500' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-blue-500' },
  { id: 'legal', label: 'Legal / Finance', icon: Scale, color: 'text-amber-500' },
  { id: 'creative', label: 'Creative', icon: Palette, color: 'text-purple-500' },
];

// Total components for UI reduction calculation
const TOTAL_UI_COMPONENTS = {
  workspaces: 7,
  subTabs: 6,
  widgets: 12,
};

interface SmartSelectorProps {
  activeRole: ViewRole | null;
  onRoleChange: (role: ViewRole | null) => void;
  activeWorkspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
  onSubTabChange?: (subTab: string) => void;
  visibleSubTabCount?: number;
  visibleWidgetCount?: number;
}

export function SmartSelector({ 
  activeRole, 
  onRoleChange, 
  activeWorkspace,
  onWorkspaceChange,
  onSubTabChange,
  visibleSubTabCount = 6,
  visibleWidgetCount = 12,
}: SmartSelectorProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewRole, setPreviewRole] = useState<ViewRole | null>(null);
  
  // Sync role from URL on mount
  useEffect(() => {
    const urlRole = searchParams.get('role') as ViewRole | null;
    if (urlRole && roleConfigs.find(r => r.id === urlRole)) {
      if (urlRole !== activeRole) {
        onRoleChange(urlRole);
      }
    }
  }, []);
  
  const handleRoleSelect = (role: ViewRole | null) => {
    onRoleChange(role);
    
    // Update URL with role param
    const newParams = new URLSearchParams(searchParams);
    if (role) {
      newParams.set('role', role);
      const config = roleConfigs.find(r => r.id === role);
      if (config) {
        newParams.set('workspace', config.defaultWorkspace);
        onWorkspaceChange(config.defaultWorkspace);
        if (config.defaultSubTab && onSubTabChange) {
          onSubTabChange(config.defaultSubTab);
        }
      }
    } else {
      newParams.delete('role');
    }
    setSearchParams(newParams);
  };

  const handlePreviewRole = (role: ViewRole) => {
    setPreviewRole(role);
    // Temporarily show that role's view
    const config = roleConfigs.find(r => r.id === role);
    if (config) {
      onWorkspaceChange(config.defaultWorkspace);
      if (config.defaultSubTab && onSubTabChange) {
        onSubTabChange(config.defaultSubTab);
      }
    }
  };

  const handleExitPreview = () => {
    setPreviewRole(null);
    // Return to executive defaults
    onWorkspaceChange('sales_bd');
  };

  const handleReturnHome = () => {
    onRoleChange(null);
    setPreviewRole(null);
    onWorkspaceChange('sales_bd');
    setSearchParams({});
    navigate('/admin');
  };

  const effectiveRole = previewRole || activeRole;
  const activeRoleConfig = roleConfigs.find(r => r.id === effectiveRole);
  const visibleWorkspaces = activeRoleConfig
    ? workspaceConfigs.filter(ws => activeRoleConfig.visibleWorkspaces.includes(ws.id))
    : workspaceConfigs.slice(0, 4);
  
  const activeWorkspaceConfig = workspaceConfigs.find(ws => ws.id === activeWorkspace);

  // Calculate real-time UI reduction percentage
  const uiReductionPercent = useMemo(() => {
    if (!effectiveRole || effectiveRole === 'executive') return 0;
    
    const hiddenWorkspaces = TOTAL_UI_COMPONENTS.workspaces - visibleWorkspaces.length;
    const hiddenSubTabs = TOTAL_UI_COMPONENTS.subTabs - visibleSubTabCount;
    const hiddenWidgets = TOTAL_UI_COMPONENTS.widgets - visibleWidgetCount;
    
    const totalComponents = TOTAL_UI_COMPONENTS.workspaces + TOTAL_UI_COMPONENTS.subTabs + TOTAL_UI_COMPONENTS.widgets;
    const hiddenComponents = hiddenWorkspaces + hiddenSubTabs + hiddenWidgets;
    
    return Math.round((hiddenComponents / totalComponents) * 100);
  }, [effectiveRole, visibleWorkspaces.length, visibleSubTabCount, visibleWidgetCount]);

  return (
    <div className="flex flex-col border-b border-border bg-secondary/30">
      {/* Breadcrumb Bar */}
      {activeRoleConfig && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-card/50 border-b border-border/50">
          {activeRoleConfig.breadcrumbPath.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <span className={index === activeRoleConfig.breadcrumbPath.length - 1 
                ? "text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground cursor-pointer"
              }>
                {crumb}
              </span>
            </span>
          ))}
          {previewRole && (
            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 rounded-none bg-amber-500/10 text-amber-600 border-amber-500/30">
              PREVIEW MODE
            </Badge>
          )}
        </div>
      )}

      {/* Main Selector Bar */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Role Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "gap-2 rounded-none min-w-[180px] justify-between",
                activeRoleConfig && activeRoleConfig.bgColor
              )}
            >
              {activeRoleConfig ? (
                <span className="flex items-center gap-2">
                  <activeRoleConfig.icon className={cn("w-4 h-4", activeRoleConfig.color)} />
                  <span className="font-medium">{activeRoleConfig.shortLabel}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Crown className="w-4 h-4" />
                  <span>Select Role View</span>
                </span>
              )}
              <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 rounded-none">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              ROLE-BASED VISIBILITY
            </DropdownMenuLabel>
            {roleConfigs.map((role) => {
              const Icon = role.icon;
              const isActive = effectiveRole === role.id;
              return (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-none cursor-pointer",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mt-0.5", role.color)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{role.label}</span>
                      {isActive && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {role.description}
                    </span>
                    <div className="flex gap-1 mt-1">
                      {role.visibleWorkspaces.slice(0, 3).map(ws => (
                        <Badge 
                          key={ws} 
                          variant="outline" 
                          className="text-[10px] px-1 py-0 rounded-none"
                        >
                          {ws.split('_')[0]}
                        </Badge>
                      ))}
                      {role.visibleWorkspaces.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1 py-0 rounded-none"
                        >
                          +{role.visibleWorkspaces.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
            {effectiveRole && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleRoleSelect(null)}
                  className="text-muted-foreground rounded-none"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Clear Role Filter
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Visible Workspaces - Filtered by Role */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {visibleWorkspaces.map((ws) => {
            const Icon = ws.icon;
            const isActive = activeWorkspace === ws.id;
            return (
              <Button
                key={ws.id}
                variant="ghost"
                size="sm"
                onClick={() => onWorkspaceChange(ws.id)}
                className={cn(
                  "gap-2 rounded-none whitespace-nowrap transition-all",
                  isActive
                    ? "bg-card border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? ws.color : '')} />
                <span className="text-sm">{ws.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Executive Preview Toggle */}
        {activeRole === 'executive' && !previewRole && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-none text-muted-foreground"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview Role</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                VIEW AS ROLE
              </DropdownMenuLabel>
              {roleConfigs.filter(r => r.id !== 'executive').map((role) => {
                const Icon = role.icon;
                return (
                  <DropdownMenuItem
                    key={role.id}
                    onClick={() => handlePreviewRole(role.id)}
                    className="rounded-none cursor-pointer"
                  >
                    <Icon className={cn("w-4 h-4 mr-2", role.color)} />
                    {role.shortLabel}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Exit Preview Button */}
        {previewRole && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExitPreview}
            className="gap-2 rounded-none border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          >
            <Eye className="w-4 h-4" />
            Exit Preview
          </Button>
        )}

        {/* UI Reduction Indicator */}
        {effectiveRole && effectiveRole !== 'executive' && uiReductionPercent > 0 && (
          <Badge 
            variant="outline" 
            className="rounded-none text-xs bg-primary/5 border-primary/20 text-primary"
          >
            {uiReductionPercent}% UI Reduction
          </Badge>
        )}

        {/* Return Home Breadcrumb */}
        {effectiveRole && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReturnHome}
            className="gap-2 rounded-none text-muted-foreground hover:text-foreground"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export function getRoleConfig(role: ViewRole | null): RoleConfig | undefined {
  return roleConfigs.find(r => r.id === role);
}

export function getVisibleSubTabs(role: ViewRole | null): string[] {
  if (!role) return ['pacing', 'intelligence', 'orders', 'performance', 'billables'];
  
  switch (role) {
    case 'accounting':
      return ['billables'];
    case 'medical':
      return []; // Medical Review is now a top-level nav item
    case 'analyst':
      return ['pacing', 'intelligence', 'orders', 'performance', 'billables'];
    case 'executive':
    default:
      return ['pacing', 'intelligence', 'orders', 'performance', 'billables'];
  }
}
