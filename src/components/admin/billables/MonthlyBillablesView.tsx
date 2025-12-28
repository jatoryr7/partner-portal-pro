import { useState } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calendar, Lock, RefreshCw } from 'lucide-react';
import { BillablesSummaryCards } from './BillablesSummaryCards';
import { NetworkStatusSidebar } from './NetworkStatusSidebar';
import { BillablesDataGrid } from './BillablesDataGrid';
import { 
  useAggregatedBillables, 
  useBillablesSummary, 
  useNetworkApiStatus,
  useApproveBillables,
  useInitiateDispute
} from '@/hooks/useBillables';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Generate last 12 months for selection
function generateMonthOptions() {
  const options = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(startOfMonth(new Date()), i);
    options.push({
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MMMM yyyy'),
    });
  }
  return options;
}

export function MonthlyBillablesView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeBrandId, setDisputeBrandId] = useState<string | null>(null);
  const [disputeNotes, setDisputeNotes] = useState('');

  const { data: apiStatuses = [], isLoading: apiLoading } = useNetworkApiStatus();
  const { data: billables = [], isLoading: billablesLoading, refetch } = useAggregatedBillables(selectedMonth);
  const { summary } = useBillablesSummary(selectedMonth);
  const approveMutation = useApproveBillables();
  const disputeMutation = useInitiateDispute();

  const handleApprove = (masterBrandId: string) => {
    if (!user?.id) return;
    approveMutation.mutate({
      masterBrandId,
      billingMonth: selectedMonth,
      approvedBy: user.id,
    });
  };

  const handleOpenDispute = (masterBrandId: string) => {
    setDisputeBrandId(masterBrandId);
    setDisputeNotes('');
    setDisputeDialogOpen(true);
  };

  const handleSubmitDispute = () => {
    if (!disputeBrandId) return;
    disputeMutation.mutate({
      masterBrandId: disputeBrandId,
      billingMonth: selectedMonth,
      notes: disputeNotes,
    }, {
      onSuccess: () => {
        setDisputeDialogOpen(false);
        setDisputeBrandId(null);
        setDisputeNotes('');
      },
    });
  };

  const handleExport = () => {
    // Generate CSV export
    const headers = ['Master Brand', 'Common ID', 'Networks', 'Conversions', 'Gross Revenue', 'Network Payout', 'Internal Track', 'Delta', 'Delta %', 'Status'];
    const rows = billables.map(b => [
      b.masterBrandName,
      b.commonId,
      b.networks.join('; '),
      b.totalConversions,
      b.totalGrossRevenue.toFixed(2),
      b.totalNetworkPayout.toFixed(2),
      b.totalInternalPayout.toFixed(2),
      b.delta.toFixed(2),
      b.deltaPercent.toFixed(2),
      b.isApproved ? 'Approved' : b.hasDiscrepancy ? 'Discrepancy' : 'Pending',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billables-${format(new Date(selectedMonth), 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Export complete', description: 'CSV file downloaded successfully.' });
  };

  const handleApproveAll = () => {
    const pendingBillables = billables.filter(b => !b.isApproved);
    if (pendingBillables.length === 0) {
      toast({ title: 'All billables already approved' });
      return;
    }
    
    // Approve all pending
    pendingBillables.forEach(b => {
      if (user?.id) {
        approveMutation.mutate({
          masterBrandId: b.masterBrandId,
          billingMonth: selectedMonth,
          approvedBy: user.id,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monthly Billables</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Reconcile and approve affiliate network payouts for accounting
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px] rounded-none bg-surface">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="rounded-none"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            onClick={handleApproveAll}
            disabled={approveMutation.isPending || billables.every(b => b.isApproved)}
            className="rounded-none bg-healthcare-teal hover:bg-healthcare-teal/90 text-white"
          >
            <Lock className="w-4 h-4 mr-2" />
            Approve All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <BillablesSummaryCards
        totalVerified={summary.totalVerified}
        totalPending={summary.totalPending}
        highVarianceCount={summary.highVarianceCount}
        netProfit={summary.netProfit}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Data Grid */}
        <BillablesDataGrid
          billables={billables}
          onApprove={handleApprove}
          onDispute={handleOpenDispute}
          isApproving={approveMutation.isPending}
        />

        {/* API Status Sidebar */}
        <NetworkStatusSidebar
          apiStatuses={apiStatuses}
          isLoading={apiLoading}
        />
      </div>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Initiate Dispute</DialogTitle>
            <DialogDescription>
              Document the discrepancy details. This will flag the record for the accounting team to review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the discrepancy and any relevant details..."
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              className="min-h-[120px] rounded-none bg-surface"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitDispute}
              disabled={disputeMutation.isPending}
              className="rounded-none bg-destructive hover:bg-destructive/90 text-white"
            >
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
