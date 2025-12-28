import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type ContractStatus = 'draft' | 'signed' | 'expired';

interface Deal {
  id: string;
  deal_name: string;
  deal_value: number | null;
  contract_status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  partners: {
    id: string;
    company_name: string;
  } | null;
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: 'Draft', icon: Clock, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  signed: { label: 'Signed', icon: CheckCircle, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  expired: { label: 'Expired', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function InsertionOrdersView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['insertion-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_deals')
        .select(`
          id,
          deal_name,
          deal_value,
          contract_status,
          start_date,
          end_date,
          notes,
          created_at,
          partners (id, company_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContractStatus }) => {
      const { error } = await supabase
        .from('campaign_deals')
        .update({ contract_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insertion-orders'] });
      toast.success('Contract status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = 
      deal.deal_name.toLowerCase().includes(search.toLowerCase()) ||
      deal.partners?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deal.contract_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const signedDeals = deals.filter(d => d.contract_status === 'signed');
  const draftDeals = deals.filter(d => d.contract_status === 'draft');
  const totalSignedValue = signedDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total IOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{deals.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signed Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{signedDeals.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{draftDeals.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signed Value</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              ${(totalSignedValue / 1000).toFixed(0)}k
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals or brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContractStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal / IO Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campaign Period</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No insertion orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => {
                const config = STATUS_CONFIG[deal.contract_status];
                const StatusIcon = config.icon;
                
                return (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{deal.deal_name}</p>
                        {deal.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {deal.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{deal.partners?.company_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deal.start_date && deal.end_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(deal.start_date), 'MMM d')} - {format(new Date(deal.end_date), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {deal.deal_value ? `$${deal.deal_value.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={deal.contract_status}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: deal.id, status: value as ContractStatus })}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="signed">Signed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
