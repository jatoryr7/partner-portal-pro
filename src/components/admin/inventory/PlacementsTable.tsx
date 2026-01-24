import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Ban,
  Calendar,
  Link2,
  Unlink
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

type PlacementStatus = 'available' | 'pitched' | 'booked' | 'upcoming';

interface Placement {
  id: string;
  name: string;
  placement_type: string;
  property: string;
  description: string | null;
  dimensions: string | null;
  rate: number | null;
  rate_type: string | null;
  status: PlacementStatus;
  scheduled_date: string | null;
  end_date: string | null;
  deal_id: string | null;
  notes: string | null;
  created_at: string;
  campaign_deals?: {
    deal_name: string;
    partners?: {
      company_name: string;
    };
  };
}

interface Deal {
  id: string;
  deal_name: string;
  partners?: {
    company_name: string;
  };
}

const STATUS_CONFIG: Record<PlacementStatus, { label: string; icon: React.ElementType; color: string }> = {
  available: { label: 'Available', icon: CheckCircle, color: 'bg-success/10 text-success border-success/20' },
  pitched: { label: 'Pitched', icon: Clock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  booked: { label: 'Booked', icon: Calendar, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  upcoming: { label: 'Upcoming', icon: Ban, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

const PLACEMENT_TYPES = [
  'Newsletter Header',
  'Newsletter Sponsored',
  'Homepage Banner',
  'Article Banner',
  'Custom Content Article',
  'Native Ad',
  'Sidebar Ad',
  'Interstitial',
  'Video Pre-roll',
];

const PROPERTIES = ['Healthline', 'Medical News Today', 'Greatist', 'Psych Central'];

export function PlacementsTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlacementStatus | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    placement_type: '',
    property: 'Healthline',
    description: '',
    dimensions: '',
    rate: '',
    rate_type: 'flat',
    scheduled_date: '',
    end_date: '',
    notes: '',
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['content-placements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_placements')
        .select('*, campaign_deals(deal_name, partners(company_name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Placement[];
    },
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['available-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_deals')
        .select('id, deal_name, partners(company_name)')
        .eq('contract_status', 'signed')
        .order('deal_name');
      if (error) throw error;
      return data as Deal[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('content_placements').insert({
        name: data.name,
        placement_type: data.placement_type,
        property: data.property,
        description: data.description || null,
        dimensions: data.dimensions || null,
        rate: data.rate ? parseFloat(data.rate) : null,
        rate_type: data.rate_type,
        scheduled_date: data.scheduled_date || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-placements'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Placement created');
    },
    onError: () => toast.error('Failed to create placement'),
  });

  const linkDealMutation = useMutation({
    mutationFn: async ({ placementId, dealId }: { placementId: string; dealId: string | null }) => {
      const { error } = await supabase
        .from('content_placements')
        .update({ deal_id: dealId })
        .eq('id', placementId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-placements'] });
      setIsLinkDialogOpen(false);
      setSelectedPlacement(null);
      toast.success('Placement updated');
    },
    onError: () => toast.error('Failed to update placement'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PlacementStatus }) => {
      const { error } = await supabase
        .from('content_placements')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-placements'] });
      toast.success('Status updated');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      placement_type: '',
      property: 'Healthline',
      description: '',
      dimensions: '',
      rate: '',
      rate_type: 'flat',
      scheduled_date: '',
      end_date: '',
      notes: '',
    });
  };

  const filteredPlacements = placements.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.placement_type.toLowerCase().includes(search.toLowerCase()) ||
      p.property.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: placements.length,
    available: placements.filter(p => p.status === 'available').length,
    pitched: placements.filter(p => p.status === 'pitched').length,
    booked: placements.filter(p => p.status === 'booked').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">{stats.available}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pitched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats.pitched}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.booked}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search placements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PlacementStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Placement
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placement</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Linked Deal</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredPlacements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No placements found
                </TableCell>
              </TableRow>
            ) : (
              filteredPlacements.map((placement) => {
                const statusConfig = STATUS_CONFIG[placement.status];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <TableRow key={placement.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{placement.name}</p>
                        {placement.dimensions && (
                          <p className="text-xs text-muted-foreground">{placement.dimensions}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{placement.placement_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{placement.property}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {placement.scheduled_date ? (
                        <div className="text-sm">
                          <p>{format(new Date(placement.scheduled_date), 'MMM d')}</p>
                          {placement.end_date && (
                            <p className="text-muted-foreground">
                              to {format(new Date(placement.end_date), 'MMM d')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {placement.rate ? (
                        <span>${placement.rate.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {placement.campaign_deals ? (
                        <div className="text-sm">
                          <p className="font-medium">{placement.campaign_deals.deal_name}</p>
                          <p className="text-muted-foreground">
                            {placement.campaign_deals.partners?.company_name}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {placement.deal_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => linkDealMutation.mutate({ placementId: placement.id, dealId: null })}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPlacement(placement);
                              setIsLinkDialogOpen(true);
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Select
                          value={placement.status}
                          onValueChange={(v) => updateStatusMutation.mutate({ id: placement.id, status: v as PlacementStatus })}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Placement</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Placement Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Q1 Newsletter Header Slot"
                  required
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.placement_type}
                  onValueChange={(v) => setFormData({ ...formData, placement_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property *</Label>
                <Select
                  value={formData.property}
                  onValueChange={(v) => setFormData({ ...formData, property: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTIES.map((prop) => (
                      <SelectItem key={prop} value={prop}>{prop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dimensions</Label>
                <Input
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder="728x90"
                />
              </div>
              <div>
                <Label>Rate ($)</Label>
                <Input
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name || !formData.placement_type || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Placement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Deal Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Deal to Placement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a signed deal to link to "{selectedPlacement?.name}". 
              The status will automatically change to "Booked".
            </p>
            <div className="space-y-2">
              {deals.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No signed deals available</p>
              ) : (
                deals.map((deal) => (
                  <Button
                    key={deal.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      if (selectedPlacement) {
                        linkDealMutation.mutate({ placementId: selectedPlacement.id, dealId: deal.id });
                      }
                    }}
                  >
                    <div className="text-left">
                      <p className="font-medium">{deal.deal_name}</p>
                      <p className="text-xs text-muted-foreground">{deal.partners?.company_name}</p>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
