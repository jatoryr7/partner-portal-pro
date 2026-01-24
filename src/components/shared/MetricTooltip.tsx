import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricTooltipProps {
  metric: 'roas' | 'cac' | 'revenue' | 'spend' | 'conversions' | 'inventory';
  children?: React.ReactNode;
}

const METRIC_DESCRIPTIONS: Record<string, { title: string; description: string; source: string }> = {
  roas: {
    title: 'Return on Ad Spend',
    description: 'Revenue generated per dollar spent on advertising. A ROAS of 3.0 means $3 revenue for every $1 spent.',
    source: 'Calculated from campaign_analytics.revenue / campaign_analytics.spend',
  },
  cac: {
    title: 'Customer Acquisition Cost',
    description: 'Average cost to acquire one new customer or conversion. Lower is better.',
    source: 'Calculated from campaign_analytics.spend / campaign_analytics.conversions',
  },
  revenue: {
    title: 'Total Revenue',
    description: 'Gross revenue attributed to campaigns during the selected period.',
    source: 'Aggregated from operational_insights.revenue',
  },
  spend: {
    title: 'Total Spend',
    description: 'Total advertising expenditure during the selected period.',
    source: 'Aggregated from campaign_analytics.spend',
  },
  conversions: {
    title: 'Conversions',
    description: 'Total number of completed desired actions (purchases, signups, etc.).',
    source: 'Aggregated from campaign_analytics.conversions',
  },
  inventory: {
    title: 'Inventory Utilization',
    description: 'Percentage of available ad inventory that has been booked or pitched.',
    source: 'Calculated from content_ad_units status distribution',
  },
};

export function MetricTooltip({ metric, children }: MetricTooltipProps) {
  const info = METRIC_DESCRIPTIONS[metric];
  
  if (!info) return <>{children}</>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-2">
            <p className="font-semibold text-sm tracking-wide">{info.title}</p>
            <p className="text-xs text-muted-foreground">{info.description}</p>
            <p className="text-xs text-primary/70 border-t border-border pt-2 mt-2">
              📊 {info.source}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
