import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Palette,
  Download,
  CheckCircle2,
  XCircle,
  Image,
  Film,
  FileText,
  Search,
  Filter,
  Grid,
  List,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ActivityFeed } from '../ActivityFeed';
import { Tables } from '@/integrations/supabase/types';

interface Asset extends Tables<'creative_assets'> {
  partners: {
    id: string;
    company_name: string;
  };
}

export function CreativeDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['creative-assets-gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_assets')
        .select(`
          *,
          partners (
            id,
            company_name
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Asset[];
    },
  });

  const approveAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('creative_assets')
        .update({ is_complete: true, is_draft: false })
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-assets-gallery'] });
      toast.success('Asset approved');
    },
    onError: (error) => {
      toast.error('Failed to approve: ' + error.message);
    },
  });

  const rejectAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('creative_assets')
        .update({ is_complete: false, is_draft: true })
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-assets-gallery'] });
      toast.success('Asset marked for revision');
    },
    onError: (error) => {
      toast.error('Failed to reject: ' + error.message);
    },
  });

  const handleBulkApprove = () => {
    selectedAssets.forEach((id) => approveAssetMutation.mutate(id));
    setSelectedAssets(new Set());
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredAssets?.map((a) => a.id) || [];
    setSelectedAssets(new Set(filteredIds));
  };

  const clearSelection = () => {
    setSelectedAssets(new Set());
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAssetTypeIcon = (channel: string) => {
    if (channel.toLowerCase().includes('video') || channel.toLowerCase().includes('media')) {
      return Film;
    }
    if (channel.toLowerCase().includes('native') || channel.toLowerCase().includes('content')) {
      return FileText;
    }
    return Image;
  };

  // Filter assets
  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch =
      asset.partners?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.copy_text?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel = channelFilter === 'all' || asset.channel === channelFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'complete' && asset.is_complete) ||
      (statusFilter === 'pending' && !asset.is_complete);

    return matchesSearch && matchesChannel && matchesStatus;
  });

  const channels = [...new Set(assets?.map((a) => a.channel) || [])];

  // Stats
  const totalAssets = assets?.length || 0;
  const completeAssets = assets?.filter((a) => a.is_complete).length || 0;
  const pendingAssets = totalAssets - completeAssets;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Creative / Content View</h2>
          <p className="text-muted-foreground">Asset gallery for downloading and approving media</p>
        </div>
        {selectedAssets.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedAssets.size} selected</span>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
            <Button size="sm" onClick={handleBulkApprove}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve Selected
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completeAssets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Filter className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{pendingAssets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Channels</CardTitle>
            <Grid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {channel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="complete">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={selectAllFiltered}>
          Select All
        </Button>
      </div>

      {/* Asset Gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredAssets?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Palette className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No assets found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets?.map((asset) => {
            const TypeIcon = getAssetTypeIcon(asset.channel);
            const isSelected = selectedAssets.has(asset.id);

            return (
              <Card
                key={asset.id}
                className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="relative aspect-video bg-muted flex items-center justify-center">
                  <TypeIcon className="h-12 w-12 text-muted-foreground/50" />
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleAssetSelection(asset.id)}
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={asset.is_complete ? 'default' : 'secondary'}>
                      {asset.is_complete ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(asset.partners?.company_name || 'NA')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {asset.partners?.company_name}
                    </span>
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {asset.channel}
                  </Badge>
                  {asset.copy_text && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {asset.copy_text}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(asset.updated_at), 'MMM d')}
                    </span>
                    <div className="flex items-center gap-1">
                      {asset.file_urls && asset.file_urls.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => window.open(asset.file_urls![0], '_blank')}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!asset.is_complete && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-500 hover:text-green-600"
                            onClick={() => approveAssetMutation.mutate(asset.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => rejectAssetMutation.mutate(asset.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <ActivityFeed partnerId={asset.partner_id} compact />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredAssets?.map((asset) => {
                const TypeIcon = getAssetTypeIcon(asset.channel);
                const isSelected = selectedAssets.has(asset.id);

                return (
                  <div
                    key={asset.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleAssetSelection(asset.id)}
                    />
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                      <TypeIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.partners?.company_name}</span>
                        <Badge variant="outline">{asset.channel}</Badge>
                        <Badge variant={asset.is_complete ? 'default' : 'secondary'}>
                          {asset.is_complete ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      {asset.copy_text && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {asset.copy_text}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(asset.updated_at), 'MMM d, yyyy')}
                    </span>
                    <div className="flex items-center gap-1">
                      {asset.file_urls && asset.file_urls.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(asset.file_urls![0], '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {!asset.is_complete && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500"
                            onClick={() => approveAssetMutation.mutate(asset.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => rejectAssetMutation.mutate(asset.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <ActivityFeed partnerId={asset.partner_id} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
