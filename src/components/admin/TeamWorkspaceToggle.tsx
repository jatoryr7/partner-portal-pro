import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, ChevronDown, Megaphone, Scale, Palette } from 'lucide-react';

export type TeamWorkspace = 'marketing' | 'legal' | 'creative';

interface TeamWorkspaceToggleProps {
  activeWorkspace: TeamWorkspace;
  onWorkspaceChange: (workspace: TeamWorkspace) => void;
}

const workspaceConfig: Record<TeamWorkspace, { label: string; icon: React.ElementType; color: string }> = {
  marketing: {
    label: 'Marketing / Affiliate',
    icon: Megaphone,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  legal: {
    label: 'Legal / Finance',
    icon: Scale,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  creative: {
    label: 'Creative / Content',
    icon: Palette,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
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
