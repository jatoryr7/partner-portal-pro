import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Briefcase,
  Search,
  Plus,
  DollarSign,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
  FolderOpen,
  Edit,
  Trash2,
  Building2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type ContractStatus = 'draft' | 'signed' | 'expired';

interface Deal {
  id: string;
  partner_id: string;
  deal_name: string;
  deal_value: number | null;
  contract_status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  assigned_internal_manager: string | null;
  notes: string | null;
  created_at: string;
  partners: {
    id: string;
    company_name: string;
  };
  creative_assets: Tables<'creative_assets'>[];
}

interface Partner {
  id: string;
  company_name: string;
}

export default function DealsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const brandFilter = searchParams.get('brand');

  // Form state
  const [formData, setFormData] = useState({
    partner_id: '',
    deal_name: '',
    deal_value: '',
    contract_status: 'draft' as ContractStatus,
    start_date: '',
    end_date: '',
    notes: '',
  });

  const { data: deals, isLoading } = useQuery({
    queryKey: ['campaign-deals', brandFilter],
    queryFn: async () => {
      let query = supabase
        .from('campaign_deals')
        .select(`
          *,
          partners (
            id,
            company_name
          ),
          creative_assets (
            *
          )
        `)
        .order('created_at', { ascending: false });

      if (brandFilter) {
        query = query.eq('partner_id', brandFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Deal[];
    },
  });

  const { data: partners } = useQuery({
    queryKey: ['partners-for-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data as Partner[];
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('campaign_deals').insert({
        partner_id: data.partner_id,
        deal_name: data.deal_name,
        deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
        contract_status: data.contract_status,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-deals'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Deal created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create deal: ' + error.message);
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('campaign_deals')
        .update({
          partner_id: data.partner_id,
          deal_name: data.deal_name,
          deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
          contract_status: data.contract_status,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          notes: data.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-deals'] });
      setEditingDeal(null);
      resetForm();
      toast.success('Deal updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update deal: ' + error.message);
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaign_deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-deals'] });
      toast.success('Deal deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete deal: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      partner_id: '',
      deal_name: '',
      deal_value: '',
      contract_status: 'draft',
      start_date: '',
      end_date: '',
      notes: '',
    });
  };

  const handleEdit = (deal: Deal) => {
    setFormData({
      partner_id: deal.partner_id,
      deal_name: deal.deal_name,
      deal_value: deal.deal_value?.toString() || '',
      contract_status: deal.contract_status,
      start_date: deal.start_date || '',
      end_date: deal.end_date || '',
      notes: deal.notes || '',
    });
    setEditingDeal(deal);
  };

  const handleSubmit = () => {
    if (!formData.partner_id || !formData.deal_name) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingDeal) {
      updateDealMutation.mutate({ id: editingDeal.id, data: formData });
    } else {
      createDealMutation.mutate(formData);
    }
  };

  const toggleDeal = (dealId: string) => {
    setExpandedDeals((prev) => {
      const next = new Set(prev);
      if (next.has(dealId)) {
        next.delete(dealId);
      } else {
        next.add(dealId);
      }
      return next;
    });
  };

  const filteredDeals = deals?.filter(
    (deal) =>
      deal.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.partners?.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'signed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalDealValue = deals?.reduce((acc, deal) => acc + (deal.deal_value || 0), 0) || 0;
  const signedDeals = deals?.filter((d) => d.contract_status === 'signed').length || 0;
  const draftDeals = deals?.filter((d) => d.contract_status === 'draft').length || 0;

  const DialogForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="partner">Brand *</Label>
        <Select
          value={formData.partner_id}
          onValueChange={(value) => setFormData({ ...formData, partner_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a brand" />
          </SelectTrigger>
          <SelectContent>
            {partners?.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="deal_name">Deal Name *</Label>
        <Input
          id="deal_name"
          value={formData.deal_name}
          onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
          placeholder="e.g., Q1 2025 Campaign"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="deal_value">Deal Value</Label>
          <Input
            id="deal_value"
            type="number"
            value={formData.deal_value}
            onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contract_status">Contract Status</Label>
          <Select
            value={formData.contract_status}
            onValueChange={(value: ContractStatus) =>
              setFormData({ ...formData, contract_status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this deal..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals CRM</h1>
          <p className="text-muted-foreground">
            Manage campaign deals and linked creative submissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
              <DialogDescription>
                Add a new campaign deal and link it to a brand.
              </DialogDescription>
            </DialogHeader>
            <DialogForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createDealMutation.isPending}>
                {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDeal} onOpenChange={(open) => !open && setEditingDeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>Update the deal details.</DialogDescription>
          </DialogHeader>
          <DialogForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateDealMutation.isPending}>
              {updateDealMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDealValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Signed Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signedDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftDeals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deals or brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Deals List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredDeals?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Briefcase className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No deals found</p>
            <p className="text-sm">Create a new deal to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDeals?.map((deal) => (
            <Card key={deal.id} className="overflow-hidden">
              <Collapsible
                open={expandedDeals.has(deal.id)}
                onOpenChange={() => toggleDeal(deal.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(deal.partners?.company_name || 'NA')}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{deal.deal_name}</h3>
                            <Badge
                              variant="outline"
                              className={getStatusColor(deal.contract_status)}
                            >
                              {deal.contract_status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {deal.partners?.company_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatCurrency(deal.deal_value)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FolderOpen className="h-3.5 w-3.5" />
                              {deal.creative_assets?.length || 0} assets
                            </span>
                            {deal.start_date && deal.end_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(deal.start_date), 'MMM d')} -{' '}
                                {format(new Date(deal.end_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(deal);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this deal?')) {
                              deleteDealMutation.mutate(deal.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedDeals.has(deal.id) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-4">
                    {deal.notes && (
                      <div className="mb-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">{deal.notes}</p>
                      </div>
                    )}

                    <h4 className="text-sm font-medium text-muted-foreground mb-4">
                      Creative Assets
                    </h4>

                    {deal.creative_assets?.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {deal.creative_assets.map((asset) => (
                          <div
                            key={asset.id}
                            className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{asset.channel}</Badge>
                              <Badge variant={asset.is_complete ? 'default' : 'outline'}>
                                {asset.is_complete ? 'Complete' : 'In Progress'}
                              </Badge>
                            </div>
                            {asset.copy_text && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {asset.copy_text}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Updated {format(new Date(asset.updated_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                        <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
                        <p className="font-medium">No creative assets yet</p>
                        <p className="text-sm mt-1">
                          Assets linked to this deal will appear here
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
