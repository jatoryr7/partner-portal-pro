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
import { Plus, Search, AlertTriangle, Package, Loader2, Layout, FileText, Video, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AD_UNIT_TYPES, INVENTORY_STATUSES } from '@/config/inputOptions';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit_of_measure: string;
  current_stock: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_cost: number | null;
  warehouse_location: string | null;
  supplier_id: string | null;
  is_active: boolean;
  created_at: string;
}

const AD_UNIT_ICONS: Record<string, React.ElementType> = {
  leaderboard: Layout,
  native: FileText,
  video: Video,
  newsletter: Mail,
  sponsored_content: FileText,
  display: Layout,
};

function getStatusBadge(status: string) {
  const statusConfig = INVENTORY_STATUSES.find(s => s.value === status);
  switch (status) {
    case 'available':
      return <Badge variant="success">{statusConfig?.label || 'Available'}</Badge>;
    case 'pitched':
      return <Badge variant="warning">{statusConfig?.label || 'Pitched'}</Badge>;
    case 'booked':
      return <Badge variant="critical">{statusConfig?.label || 'Booked'}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function InventoryView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unit_of_measure: 'unit',
    current_stock: 0,
    reorder_level: 10,
    reorder_quantity: 50,
    unit_cost: '',
    warehouse_location: '',
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('inventory_items').insert({
        ...data,
        unit_cost: data.unit_cost ? parseFloat(data.unit_cost) : null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsDialogOpen(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: '',
        unit_of_measure: 'unit',
        current_stock: 0,
        reorder_level: 10,
        reorder_quantity: 50,
        unit_cost: '',
        warehouse_location: '',
      });
      toast.success('Inventory item created');
    },
    onError: () => toast.error('Failed to create item'),
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.category === typeFilter;
    return matchesSearch && matchesType;
  });

  const lowStockItems = items.filter((item) => item.current_stock <= item.reorder_level);
  const totalValue = items.reduce((sum, item) => sum + (item.unit_cost || 0) * item.current_stock, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{items.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-critical" />
              <span className="text-2xl font-bold">{lowStockItems.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {items.reduce((sum, item) => sum + item.current_stock, 0).toLocaleString()}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">${totalValue.toLocaleString()}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-surface"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] bg-surface">
              <SelectValue placeholder="Ad Unit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {AD_UNIT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    {type.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-surface">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {INVENTORY_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Table */}
      <Card className="rounded-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold tracking-wide">SKU</TableHead>
              <TableHead className="font-semibold tracking-wide">Name</TableHead>
              <TableHead className="font-semibold tracking-wide">Type</TableHead>
              <TableHead className="font-semibold tracking-wide">Location</TableHead>
              <TableHead className="text-right font-semibold tracking-wide">Stock</TableHead>
              <TableHead className="text-right font-semibold tracking-wide">Reorder Level</TableHead>
              <TableHead className="text-right font-semibold tracking-wide">Unit Cost</TableHead>
              <TableHead className="font-semibold tracking-wide">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const IconComponent = item.category ? AD_UNIT_ICONS[item.category] || Package : Package;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="outline" className="rounded-none">
                          {AD_UNIT_TYPES.find(t => t.value === item.category)?.label || item.category}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{item.warehouse_location || '-'}</TableCell>
                    <TableCell className="text-right">{item.current_stock}</TableCell>
                    <TableCell className="text-right">{item.reorder_level}</TableCell>
                    <TableCell className="text-right">
                      {item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {item.current_stock <= item.reorder_level ? (
                        <Badge variant="critical">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="tracking-scientific">Add Inventory Item</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="bg-surface"
                  required
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-surface"
                  required
                />
              </div>
              <div>
                <Label>Ad Unit Type</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-surface">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_UNIT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.warehouse_location}
                  onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
                  className="bg-surface"
                />
              </div>
              <div>
                <Label>Current Stock</Label>
                <Input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                  className="bg-surface"
                />
              </div>
              <div>
                <Label>Unit Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  className="bg-surface"
                />
              </div>
              <div>
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                  className="bg-surface"
                />
              </div>
              <div>
                <Label>Reorder Qty</Label>
                <Input
                  type="number"
                  value={formData.reorder_quantity}
                  onChange={(e) => setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })}
                  className="bg-surface"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
