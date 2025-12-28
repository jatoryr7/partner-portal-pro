import React, { useState, useMemo } from 'react';
import { Settings, Plus, Trash2, GripVertical, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAllConfigurations,
  useCreateConfiguration,
  useUpdateConfiguration,
  useDeleteConfiguration,
  useReorderConfigurations,
  useBulkImportConfigurations,
  CATEGORY_LABELS,
  CATEGORY_GROUPS,
  type AppConfiguration,
  type ConfigurationCategory,
} from '@/hooks/useAppConfigurations';
import { toast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<string>('Sales & CRM');
  const [selectedCategory, setSelectedCategory] = useState<ConfigurationCategory>('industries');
  const [editingItem, setEditingItem] = useState<AppConfiguration | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AppConfiguration | null>(null);
  const [draggedItem, setDraggedItem] = useState<AppConfiguration | null>(null);

  const { data: allConfigs, isLoading } = useAllConfigurations();
  const createMutation = useCreateConfiguration();
  const updateMutation = useUpdateConfiguration();
  const deleteMutation = useDeleteConfiguration();
  const reorderMutation = useReorderConfigurations();
  const bulkImportMutation = useBulkImportConfigurations();

  // Form state for add/edit
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    value: '',
    description: '',
    color: '',
  });

  // Filter configs by selected category
  const filteredConfigs = useMemo(() => {
    if (!allConfigs) return [];
    return allConfigs
      .filter(c => c.category === selectedCategory)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [allConfigs, selectedCategory]);

  // Get categories for current tab
  const tabCategories = useMemo(() => {
    const group = CATEGORY_GROUPS[activeTab as keyof typeof CATEGORY_GROUPS];
    return group || [];
  }, [activeTab]);

  // Handle tab change - select first category in group
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const group = CATEGORY_GROUPS[tab as keyof typeof CATEGORY_GROUPS];
    if (group && group.length > 0) {
      setSelectedCategory(group[0] as ConfigurationCategory);
    }
  };

  // Handle add new item
  const handleAdd = () => {
    setFormData({ key: '', label: '', value: '', description: '', color: '' });
    setEditingItem(null);
    setIsAddDialogOpen(true);
  };

  // Handle edit item
  const handleEdit = (item: AppConfiguration) => {
    setFormData({
      key: item.key,
      label: item.label,
      value: item.value || '',
      description: item.description || '',
      color: item.color || '',
    });
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  // Handle save (create or update)
  const handleSave = () => {
    const maxSortOrder = filteredConfigs.length > 0 
      ? Math.max(...filteredConfigs.map(c => c.sort_order)) 
      : 0;

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        key: formData.key,
        label: formData.label,
        value: formData.value || null,
        description: formData.description || null,
        color: formData.color || null,
      });
    } else {
      createMutation.mutate({
        category: selectedCategory,
        key: formData.key.toLowerCase().replace(/\s+/g, '_'),
        label: formData.label,
        value: formData.value || null,
        description: formData.description || null,
        color: formData.color || null,
        sort_order: maxSortOrder + 1,
        is_active: true,
        metadata: {},
        created_by: null,
      });
    }
    setIsAddDialogOpen(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: AppConfiguration) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: AppConfiguration) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const items = [...filteredConfigs];
    const draggedIndex = items.findIndex(i => i.id === draggedItem.id);
    const targetIndex = items.findIndex(i => i.id === targetItem.id);

    items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index + 1,
    }));

    reorderMutation.mutate(updates);
    setDraggedItem(null);
  };

  // CSV Import handler
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const configs = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] || '';
          });
          
          return {
            category: selectedCategory,
            key: obj.key || obj.label?.toLowerCase().replace(/\s+/g, '_') || `item_${index}`,
            label: obj.label || obj.key || `Item ${index + 1}`,
            value: obj.value || null,
            description: obj.description || null,
            color: obj.color || null,
            sort_order: parseInt(obj.sort_order) || index + 1,
            is_active: true,
            metadata: {},
            created_by: null,
          };
        });

        bulkImportMutation.mutate(configs as any);
      } catch (error) {
        toast({ title: 'Failed to parse CSV', description: 'Please check the file format', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // CSV Export handler
  const handleCSVExport = () => {
    const headers = ['key', 'label', 'value', 'description', 'color', 'sort_order'];
    const rows = filteredConfigs.map(c => [
      c.key,
      c.label,
      c.value || '',
      c.description || '',
      c.color || '',
      c.sort_order,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCategory}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1ABC9C] rounded-none">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
              <p className="text-muted-foreground">Manage system-wide dropdowns, taxonomies, and business logic</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar with Tabs */}
          <div className="col-span-3">
            <Card className="rounded-none border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Configuration Groups</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
                  <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 rounded-none">
                    {Object.keys(CATEGORY_GROUPS).map((group) => (
                      <TabsTrigger
                        key={group}
                        value={group}
                        className="w-full justify-start px-4 py-3 rounded-none border-l-2 border-transparent data-[state=active]:border-l-[#1ABC9C] data-[state=active]:bg-[#1ABC9C]/10 data-[state=active]:text-[#1ABC9C] hover:bg-muted/50"
                      >
                        {group}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Category List */}
            <Card className="rounded-none border-border mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {tabCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat as ConfigurationCategory)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedCategory === cat
                          ? 'bg-[#1ABC9C]/10 text-[#1ABC9C] font-medium'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {CATEGORY_LABELS[cat as ConfigurationCategory]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Panel */}
          <div className="col-span-9">
            <Card className="rounded-none border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{CATEGORY_LABELS[selectedCategory]}</CardTitle>
                  <CardDescription>
                    {filteredConfigs.length} items • Drag to reorder
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                    id="csv-import"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    onClick={() => document.getElementById('csv-import')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    onClick={handleCSVExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-none bg-[#1ABC9C] hover:bg-[#1ABC9C]/90"
                    onClick={handleAdd}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-none" />
                    ))}
                  </div>
                ) : filteredConfigs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No items in this category</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 rounded-none"
                      onClick={handleAdd}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConfigs.map((item) => (
                        <TableRow
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, item)}
                          className={`border-border cursor-move ${
                            draggedItem?.id === item.id ? 'opacity-50' : ''
                          }`}
                        >
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell className="font-medium">{item.label}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {item.key}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.value || '-'}
                          </TableCell>
                          <TableCell>
                            {item.color ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-none border border-border"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-xs text-muted-foreground">{item.color}</span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-none"
                                onClick={() => handleEdit(item)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-none text-destructive hover:text-destructive"
                                onClick={() => {
                                  setItemToDelete(item);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the configuration item' : `Add a new item to ${CATEGORY_LABELS[selectedCategory]}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Display label"
                className="rounded-none bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Unique identifier (auto-generated if empty)"
                className="rounded-none bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Optional value"
                className="rounded-none bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                className="rounded-none bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#1ABC9C"
                  className="rounded-none bg-white"
                />
                {formData.color && (
                  <div
                    className="w-10 h-10 rounded-none border border-border flex-shrink-0"
                    style={{ backgroundColor: formData.color }}
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="rounded-none bg-[#1ABC9C] hover:bg-[#1ABC9C]/90"
              disabled={!formData.label || createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.label}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="rounded-none"
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;
