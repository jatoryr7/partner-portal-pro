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
import { Users, ChevronDown, Megaphone, Scale, Palette, Briefcase, Settings2, UserCog, LayoutGrid } from 'lucide-react';

export type TeamWorkspace = 'marketing' | 'legal' | 'creative' | 'business_dev' | 'operations' | 'partner_mgmt' | 'content_inventory';

interface TeamWorkspaceToggleProps {
  activeWorkspace: TeamWorkspace;
  onWorkspaceChange: (workspace: TeamWorkspace) => void;
}

const workspaceConfig: Record<TeamWorkspace, { label: string; icon: React.ElementType; color: string; group: string }> = {
  marketing: {
    label: 'Marketing / Affiliate',
    icon: Megaphone,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    group: 'core',
  },
  legal: {
    label: 'Legal / Finance',
    icon: Scale,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    group: 'core',
  },
  creative: {
    label: 'Creative / Content',
    icon: Palette,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    group: 'core',
  },
  business_dev: {
    label: 'Business Development',
    icon: Briefcase,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    group: 'sales',
  },
  partner_mgmt: {
    label: 'Partner Management',
    icon: UserCog,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    group: 'sales',
  },
  content_inventory: {
    label: 'Content Inventory',
    icon: LayoutGrid,
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    group: 'media',
  },
  operations: {
    label: 'Operations',
    icon: Settings2,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    group: 'ops',
  },
};

export function TeamWorkspaceToggle({ activeWorkspace, onWorkspaceChange }: TeamWorkspaceToggleProps) {
  const current = workspaceConfig[activeWorkspace];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          <Badge variant="outline" className={current.color}>
            <Icon className="h-3 w-3 mr-1" />
            {current.label}
          </Badge>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {(Object.keys(workspaceConfig) as TeamWorkspace[]).map((key) => {
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
