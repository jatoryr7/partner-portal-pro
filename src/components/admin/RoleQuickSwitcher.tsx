import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Crown, LineChart, Calculator, Stethoscope, 
  ChevronDown, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type ViewRole = 'executive' | 'analyst' | 'accounting' | 'medical';

interface RoleConfig {
  id: ViewRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  visibleWorkspaces: string[];
  focusAreas: string[];
}

const roleConfigs: RoleConfig[] = [
  {
    id: 'executive',
    label: 'Executive View',
    icon: Crown,
    description: 'High-level KPIs & strategic overview',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    visibleWorkspaces: ['sales_bd', 'operations', 'inventory', 'partner_success'],
    focusAreas: ['revenue', 'pipeline', 'growth'],
  },
  {
    id: 'analyst',
    label: 'Analyst View',
    icon: LineChart,
    description: 'Data analysis & performance metrics',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    visibleWorkspaces: ['operations', 'inventory'],
    focusAreas: ['metrics', 'trends', 'reports'],
  },
  {
    id: 'accounting',
    label: 'Accounting View',
    icon: Calculator,
    description: 'Billables, reconciliation & payouts',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    visibleWorkspaces: ['operations'],
    focusAreas: ['billables', 'reconciliation', 'disputes'],
  },
  {
    id: 'medical',
    label: 'Medical Reviewer',
    icon: Stethoscope,
    description: 'Clinical reviews & compliance',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    visibleWorkspaces: ['operations'],
    focusAreas: ['medical', 'compliance', 'standards'],
  },
];

interface RoleQuickSwitcherProps {
  activeRole: ViewRole | null;
  onRoleChange: (role: ViewRole | null) => void;
}

export function RoleQuickSwitcher({ activeRole, onRoleChange }: RoleQuickSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleRoleSelect = (role: ViewRole) => {
    if (activeRole === role) {
      onRoleChange(null);
    } else {
      onRoleChange(role);
      // Navigate to appropriate workspace based on role
      const config = roleConfigs.find(r => r.id === role);
      if (config && config.visibleWorkspaces.length > 0) {
        setSearchParams({ workspace: config.visibleWorkspaces[0] });
      }
    }
  };

  const activeConfig = roleConfigs.find(r => r.id === activeRole);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border-b border-border">
      <span className="text-xs font-medium text-muted-foreground mr-2">Quick Switch:</span>
      
      {/* Desktop: Show all buttons */}
      <div className="hidden md:flex items-center gap-1">
        {roleConfigs.map((role) => {
          const Icon = role.icon;
          const isActive = activeRole === role.id;
          return (
            <Button
              key={role.id}
              variant="ghost"
              size="sm"
              onClick={() => handleRoleSelect(role.id)}
              className={cn(
                "gap-2 rounded-none border transition-all",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent hover:border-border hover:bg-card"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : role.color)} />
              <span className="text-sm">{role.label}</span>
              {isActive && <Check className="w-3 h-3 text-primary" />}
            </Button>
          );
        })}
        
        {activeRole && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRoleChange(null)}
            className="ml-2 text-xs text-muted-foreground hover:text-destructive rounded-none"
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Mobile: Dropdown */}
      <div className="md:hidden flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between rounded-none"
            >
              {activeConfig ? (
                <span className="flex items-center gap-2">
                  <activeConfig.icon className={cn("w-4 h-4", activeConfig.color)} />
                  {activeConfig.label}
                </span>
              ) : (
                <span className="text-muted-foreground">Select Role View</span>
              )}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-none">
            {roleConfigs.map((role) => {
              const Icon = role.icon;
              return (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-none",
                    activeRole === role.id && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("w-4 h-4", role.color)} />
                  <div className="flex-1">
                    <span className="block text-sm font-medium">{role.label}</span>
                    <span className="block text-xs text-muted-foreground">{role.description}</span>
                  </div>
                  {activeRole === role.id && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function getRoleConfig(role: ViewRole | null): RoleConfig | undefined {
  return roleConfigs.find(r => r.id === role);
}

export { roleConfigs };
