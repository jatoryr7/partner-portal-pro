import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type JumpDestination = 
  | 'pipeline'
  | 'brands'
  | 'billables'
  | 'medical'
  | 'inventory'
  | 'queue';

interface JumpConfig {
  label: string;
  route: string;
  workspace?: string;
  tab?: string;
}

const jumpDestinations: Record<JumpDestination, JumpConfig> = {
  pipeline: {
    label: 'View in Pipeline',
    route: '/admin/deals',
    workspace: 'sales_bd',
  },
  brands: {
    label: 'View Brand Details',
    route: '/admin/brands',
    workspace: 'operations',
  },
  billables: {
    label: 'View Billables',
    route: '/admin',
    workspace: 'operations',
    tab: 'billables',
  },
  medical: {
    label: 'View Medical Review',
    route: '/admin',
    workspace: 'operations',
    tab: 'medical',
  },
  inventory: {
    label: 'View Inventory',
    route: '/admin',
    workspace: 'operations',
    tab: 'inventory',
  },
  queue: {
    label: 'View in Queue',
    route: '/admin/queue',
    workspace: 'sales_bd',
  },
};

interface JumpButtonProps {
  to: JumpDestination;
  label?: string;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
  brandId?: string;
  dealId?: string;
}

export function JumpButton({ 
  to, 
  label, 
  variant = 'default', 
  className,
  brandId,
  dealId 
}: JumpButtonProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  
  const config = jumpDestinations[to];
  const displayLabel = label || config.label;

  const handleJump = () => {
    let route = config.route;
    
    // Append IDs to route if provided
    if (brandId) {
      route = `${config.route}?brand=${brandId}`;
    } else if (dealId) {
      route = `${config.route}?deal=${dealId}`;
    }
    
    if (config.workspace) {
      setSearchParams({ workspace: config.workspace });
    }
    
    navigate(route);
  };

  if (variant === 'inline') {
    return (
      <button
        onClick={handleJump}
        className={cn(
          "inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 hover:underline transition-all",
          className
        )}
      >
        {displayLabel}
        <ArrowRight className="w-3 h-3" />
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleJump}
        className={cn(
          "h-7 px-2 gap-1 text-xs rounded-none border border-border hover:border-primary hover:bg-primary/5",
          className
        )}
      >
        <ExternalLink className="w-3 h-3" />
        {displayLabel}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleJump}
      className={cn(
        "gap-2 rounded-none border-primary/30 text-primary hover:bg-primary/10 hover:border-primary",
        className
      )}
    >
      <ExternalLink className="w-4 h-4" />
      {displayLabel}
    </Button>
  );
}

// Convenience components for common jumps
export function JumpToPipeline({ brandId, dealId }: { brandId?: string; dealId?: string }) {
  return <JumpButton to="pipeline" label="View in Sales Pipeline" brandId={brandId} dealId={dealId} variant="compact" />;
}

export function JumpToBrands({ brandId }: { brandId?: string }) {
  return <JumpButton to="brands" label="View Brand" brandId={brandId} variant="compact" />;
}

export function JumpToMedical({ brandId }: { brandId?: string }) {
  return <JumpButton to="medical" label="View Medical Review" brandId={brandId} variant="compact" />;
}

export function JumpToBillables({ brandId }: { brandId?: string }) {
  return <JumpButton to="billables" label="View Billables" brandId={brandId} variant="compact" />;
}
