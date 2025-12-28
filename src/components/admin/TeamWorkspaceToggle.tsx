import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Briefcase, Settings2, Compass, Users, LayoutGrid, Megaphone, Scale, Palette, UserCog } from 'lucide-react';

export type TeamWorkspace = 
  | 'sales_bd' 
  | 'operations' 
  | 'inventory' 
  | 'partner_success'
  | 'marketing' 
  | 'legal' 
  | 'creative';

interface TeamWorkspaceToggleProps {
  activeWorkspace: TeamWorkspace;
  onWorkspaceChange: (workspace: TeamWorkspace) => void;
}

const workspaceConfig: Record<TeamWorkspace, { label: string; icon: React.ElementType; color: string; group: 'primary' | 'secondary' }> = {
  sales_bd: {
    label: 'Sales / BD',
    icon: Briefcase,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    group: 'primary',
  },
  operations: {
    label: 'Operations',
    icon: Settings2,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    group: 'primary',
  },
  inventory: {
    label: 'Inventory',
    icon: Compass,
    color: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    group: 'primary',
  },
  partner_success: {
    label: 'Partner Success',
    icon: Users,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    group: 'primary',
  },
  marketing: {
    label: 'Marketing',
    icon: Megaphone,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    group: 'secondary',
  },
  legal: {
    label: 'Legal / Finance',
    icon: Scale,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    group: 'secondary',
  },
  creative: {
    label: 'Creative',
    icon: Palette,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    group: 'secondary',
  },
};

const primaryWorkspaces: TeamWorkspace[] = ['sales_bd', 'operations', 'inventory', 'partner_success'];
const secondaryWorkspaces: TeamWorkspace[] = ['marketing', 'legal', 'creative'];

export function TeamWorkspaceToggle({ activeWorkspace, onWorkspaceChange }: TeamWorkspaceToggleProps) {
  const current = workspaceConfig[activeWorkspace];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Badge variant="outline" className={current.color}>
            <Icon className="h-3 w-3 mr-1" />
            {current.label}
          </Badge>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel>Primary Workspaces</DropdownMenuLabel>
        {primaryWorkspaces.map((key) => {
          const config = workspaceConfig[key];
          const ItemIcon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onWorkspaceChange(key)}
              className={activeWorkspace === key ? 'bg-accent' : ''}
            >
              <ItemIcon className="h-4 w-4 mr-2" />
              {config.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Additional Views</DropdownMenuLabel>
        {secondaryWorkspaces.map((key) => {
          const config = workspaceConfig[key];
          const ItemIcon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onWorkspaceChange(key)}
              className={activeWorkspace === key ? 'bg-accent' : ''}
            >
              <ItemIcon className="h-4 w-4 mr-2" />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
