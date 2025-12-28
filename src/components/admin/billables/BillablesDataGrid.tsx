import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, FileWarning, Flag } from 'lucide-react';
import { AggregatedBillable, MonthlyBillable } from '@/hooks/useBillables';
import { cn } from '@/lib/utils';

interface BillablesDataGridProps {
  billables: AggregatedBillable[];
  onApprove: (masterBrandId: string) => void;
  onDispute: (masterBrandId: string) => void;
  isApproving: boolean;
}

const networkBadgeColors: Record<string, string> = {
  impact: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
  cj: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  shareasale: 'bg-green-500/10 text-green-700 border-green-500/30',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function NetworkBreakdownRow({ record }: { record: MonthlyBillable }) {
  return (
    <TableRow className="bg-muted/30 hover:bg-muted/50">
      <TableCell className="pl-12">
        <Badge variant="outline" className={cn('rounded-none text-xs', networkBadgeColors[record.network])}>
          {record.network.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell />
      <TableCell className="text-right font-mono text-sm">{record.conversions.toLocaleString()}</TableCell>
      <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(record.gross_revenue))}</TableCell>
      <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(record.network_reported_payout))}</TableCell>
      <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(record.internal_tracked_payout))}</TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatCurrency(Number(record.network_reported_payout) - Number(record.internal_tracked_payout))}
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

function BillableRow({ 
  billable, 
  onApprove, 
  onDispute,
  isApproving 
}: { 
  billable: AggregatedBillable; 
  onApprove: (id: string) => void;
  onDispute: (id: string) => void;
  isApproving: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <TableRow 
        className={cn(
          'transition-colors',
          billable.hasDiscrepancy && !billable.isApproved && 'bg-amber-500/5 hover:bg-amber-500/10',
          billable.isApproved && 'bg-healthcare-teal/5'
        )}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-none"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <span>{billable.masterBrandName}</span>
            <span className="text-xs text-muted-foreground">({billable.commonId})</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-1 flex-wrap">
            {billable.networks.map(network => (
              <Badge 
                key={network} 
                variant="outline" 
                className={cn('rounded-none text-xs', networkBadgeColors[network])}
              >
                {network.toUpperCase()}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell className="text-right font-mono">{billable.totalConversions.toLocaleString()}</TableCell>
        <TableCell className="text-right font-mono">{formatCurrency(billable.totalGrossRevenue)}</TableCell>
        <TableCell className="text-right font-mono">{formatCurrency(billable.totalNetworkPayout)}</TableCell>
        <TableCell className="text-right font-mono">{formatCurrency(billable.totalInternalPayout)}</TableCell>
        <TableCell className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center justify-end gap-1 font-mono',
                  billable.hasDiscrepancy ? 'text-amber-600' : 'text-muted-foreground'
                )}>
                  {billable.hasDiscrepancy && <AlertTriangle className="w-4 h-4" />}
                  <span>{formatCurrency(billable.delta)}</span>
                  <span className="text-xs">({formatPercent(billable.deltaPercent)})</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs rounded-none">
                {billable.hasDiscrepancy ? (
                  <div className="text-xs">
                    <p className="font-semibold text-amber-600 mb-1">⚠️ Discrepancy Detected</p>
                    <p>Variance exceeds 5% threshold. Review network data and initiate dispute if necessary.</p>
                  </div>
                ) : (
                  <p className="text-xs">Variance within acceptable 5% threshold.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 justify-end">
            {billable.isApproved ? (
              <Badge variant="outline" className="rounded-none bg-healthcare-teal/10 text-healthcare-teal border-healthcare-teal/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved
              </Badge>
            ) : (
              <>
                {billable.hasDiscrepancy && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDispute(billable.masterBrandId)}
                    className="rounded-none text-xs h-7 bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                  >
                    <Flag className="w-3 h-3 mr-1" />
                    Dispute
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onApprove(billable.masterBrandId)}
                  disabled={isApproving}
                  className="rounded-none text-xs h-7 bg-healthcare-teal hover:bg-healthcare-teal/90 text-white"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && billable.billableRecords.map(record => (
        <NetworkBreakdownRow key={record.id} record={record} />
      ))}
    </>
  );
}

export function BillablesDataGrid({ billables, onApprove, onDispute, isApproving }: BillablesDataGridProps) {
  if (billables.length === 0) {
    return (
      <div className="border border-border bg-surface p-12 text-center rounded-none">
        <FileWarning className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Billables Found</h3>
        <p className="text-muted-foreground text-sm">
          No billing data available for the selected period. Import data or sync with affiliate networks.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface rounded-none overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold tracking-scientific">Master Brand</TableHead>
            <TableHead className="font-semibold tracking-scientific">Networks</TableHead>
            <TableHead className="text-right font-semibold tracking-scientific">Conversions</TableHead>
            <TableHead className="text-right font-semibold tracking-scientific">Gross Rev</TableHead>
            <TableHead className="text-right font-semibold tracking-scientific">Network Payout</TableHead>
            <TableHead className="text-right font-semibold tracking-scientific">Internal Track</TableHead>
            <TableHead className="text-right font-semibold tracking-scientific">Delta</TableHead>
            <TableHead className="text-right font-semibold tracking-scientific">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {billables.map((billable, idx) => (
            <BillableRow 
              key={billable.masterBrandId} 
              billable={billable}
              onApprove={onApprove}
              onDispute={onDispute}
              isApproving={isApproving}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
