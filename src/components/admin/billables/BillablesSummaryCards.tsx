import { Card } from '@/components/ui/card';
import { DollarSign, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
  tooltip?: string;
}

function SummaryCard({ title, value, subtitle, icon, variant = 'default', tooltip }: SummaryCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-healthcare-teal/30 bg-healthcare-teal/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    info: 'border-pulse-blue/30 bg-pulse-blue/5',
  };

  return (
    <Card className={`p-6 rounded-none border ${variantStyles[variant]} bg-surface`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground tracking-scientific">{title}</span>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-2 bg-background rounded-none border border-border">
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface BillablesSummaryCardsProps {
  totalVerified: number;
  totalPending: number;
  highVarianceCount: number;
  netProfit: number;
}

export function BillablesSummaryCards({
  totalVerified,
  totalPending,
  highVarianceCount,
  netProfit,
}: BillablesSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Billable (Verified)"
        value={formatCurrency(totalVerified)}
        subtitle="Approved for accounting"
        icon={<DollarSign className="w-5 h-5 text-healthcare-teal" />}
        variant="success"
        tooltip="Sum of all network payouts that have been verified and approved for billing."
      />
      <SummaryCard
        title="Total Pending (Unverified)"
        value={formatCurrency(totalPending)}
        subtitle="Awaiting approval"
        icon={<Clock className="w-5 h-5 text-pulse-blue" />}
        variant="info"
        tooltip="Network payouts pending reconciliation and approval."
      />
      <SummaryCard
        title="High-Variance Alerts"
        value={highVarianceCount.toString()}
        subtitle={highVarianceCount > 0 ? 'Requires attention' : 'All clear'}
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        variant={highVarianceCount > 0 ? 'warning' : 'default'}
        tooltip="Count of brands with >5% variance between network-reported and internal-tracked payouts."
      />
      <SummaryCard
        title="Net Publisher Profit"
        value={formatCurrency(netProfit)}
        subtitle="Gross revenue minus payouts"
        icon={<TrendingUp className="w-5 h-5 text-foreground" />}
        variant="default"
        tooltip="Total gross revenue minus total network payouts for the billing period."
      />
    </div>
  );
}
