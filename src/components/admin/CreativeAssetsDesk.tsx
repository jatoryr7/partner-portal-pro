import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Image, 
  FileText, 
  Video, 
  Search, 
  Filter,
  Megaphone,
  Target,
  Tv,
  Mail,
  PenTool,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

// Channel configuration with Pulse & Precision color pips
const CHANNEL_CONFIG = {
  native: { 
    label: 'Native', 
    icon: Megaphone, 
    color: 'bg-orange-500', 
    textColor: 'text-orange-600',
    route: '/admin/native',
    lightBg: 'bg-orange-500/10'
  },
  paid_social_search: { 
    label: 'Social', 
    icon: Target, 
    color: 'bg-blue-500', 
    textColor: 'text-blue-600',
    route: '/admin/paid-social',
    lightBg: 'bg-blue-500/10'
  },
  media: { 
    label: 'Media', 
    icon: Tv, 
    color: 'bg-purple-500', 
    textColor: 'text-purple-600',
    route: '/admin/media',
    lightBg: 'bg-purple-500/10'
  },
  newsletter: { 
    label: 'Newsletter', 
    icon: Mail, 
    color: 'bg-green-500', 
    textColor: 'text-green-600',
    route: '/admin/newsletter',
    lightBg: 'bg-green-500/10'
  },
  content_marketing: { 
    label: 'Content', 
    icon: PenTool, 
    color: 'bg-teal-500', 
    textColor: 'text-teal-600',
    route: '/admin/content-marketing',
    lightBg: 'bg-teal-500/10'
  },
};

type AssetType = 'image' | 'copy' | 'video' | 'all';
type AssetStatus = 'pending' | 'approved' | 'revision' | 'all';

interface CreativeAsset {
  id: string;
  channel: string;
  copy_text: string | null;
  file_urls: string[] | null;
  promo_copy: string | null;
  created_at: string;
  updated_at: string;
  is_complete: boolean;
  partner: {
    company_name: string;
  } | null;
  feedback: {
    status: string;
    comments: string | null;
  } | null;
}

interface CreativeAssetsDeskProps {
  channelFilter?: string;
  compact?: boolean;
}

export function CreativeAssetsDesk({ channelFilter, compact = false }: CreativeAssetsDeskProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType>('all');
  const [statusFilter, setStatusFilter] = useState<AssetStatus>('all');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['creative-assets-desk', channelFilter],
    queryFn: async () => {
      let query = supabase
        .from('creative_assets')
        .select(`
          id,
          channel,
          copy_text,
          file_urls,
          promo_copy,
          created_at,
          updated_at,
          is_complete,
          partner:partners(company_name),
          feedback:asset_feedback(status, comments)
        `)
        .order('updated_at', { ascending: false })
        .limit(compact ? 10 : 50);

      if (channelFilter) {
        query = query.eq('channel', channelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(asset => ({
        ...asset,
        partner: Array.isArray(asset.partner) ? asset.partner[0] : asset.partner,
        feedback: Array.isArray(asset.feedback) ? asset.feedback[0] : asset.feedback,
      })) as CreativeAsset[];
    },
  });

  // Filter assets based on search, type, and status
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.partner?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.copy_text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'image' && asset.file_urls?.length) ||
      (typeFilter === 'copy' && asset.copy_text) ||
      (typeFilter === 'video' && asset.file_urls?.some(url => url.includes('.mp4')));
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && !asset.feedback?.status) ||
      (statusFilter === 'approved' && asset.feedback?.status === 'approved') ||
      (statusFilter === 'revision' && asset.feedback?.status === 'needs_revision');

    return matchesSearch && matchesType && matchesStatus;
  });

  // Aggregate stats per channel
  const channelStats = Object.keys(CHANNEL_CONFIG).map(channel => {
    const channelAssets = assets.filter(a => a.channel === channel);
    return {
      channel,
      total: channelAssets.length,
      pending: channelAssets.filter(a => !a.feedback?.status).length,
      approved: channelAssets.filter(a => a.feedback?.status === 'approved').length,
      revision: channelAssets.filter(a => a.feedback?.status === 'needs_revision').length,
    };
  });

  const getAssetTypeIcon = (asset: CreativeAsset) => {
    if (asset.file_urls?.some(url => url.includes('.mp4'))) return Video;
    if (asset.file_urls?.length) return Image;
    return FileText;
  };

  const getStatusBadge = (asset: CreativeAsset) => {
    if (!asset.feedback?.status) {
      return (
        <Badge variant="outline" className="rounded-none text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (asset.feedback.status === 'approved') {
      return (
        <Badge variant="outline" className="rounded-none text-xs bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="rounded-none text-xs bg-red-500/10 text-red-600 border-red-500/30">
        <AlertCircle className="w-3 h-3 mr-1" />
        Revision
      </Badge>
    );
  };

  if (compact) {
    return (
      <Card className="rounded-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Creative Assets Desk</CardTitle>
            <Link to="/admin/queue">
              <Button variant="ghost" size="sm" className="rounded-none gap-1 text-primary">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Channel Quick Stats */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {channelStats.map((stat) => {
              const config = CHANNEL_CONFIG[stat.channel as keyof typeof CHANNEL_CONFIG];
              if (!config) return null;
              return (
                <Link key={stat.channel} to={config.route}>
                  <div className={cn(
                    "p-2 border border-border hover:border-primary/30 transition-colors cursor-pointer",
                    config.lightBg
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn("w-2 h-2 rounded-none", config.color)} />
                      <span className="text-xs font-medium truncate">{config.label}</span>
                    </div>
                    <div className="text-lg font-bold">{stat.total}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {stat.pending} pending
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Recent Assets Feed */}
          <div className="space-y-2">
            {filteredAssets.slice(0, 5).map((asset) => {
              const TypeIcon = getAssetTypeIcon(asset);
              const channelConfig = CHANNEL_CONFIG[asset.channel as keyof typeof CHANNEL_CONFIG];
              
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-2 border border-border hover:bg-card/50 transition-colors"
                >
                  <div className={cn("w-8 h-8 flex items-center justify-center", channelConfig?.lightBg)}>
                    <TypeIcon className={cn("w-4 h-4", channelConfig?.textColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {asset.partner?.company_name || 'Unknown Brand'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-none", channelConfig?.color)} />
                    {getStatusBadge(asset)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">Creative Assets Desk</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage creative submissions across all channels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48 rounded-none"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AssetType)}>
              <SelectTrigger className="w-32 rounded-none">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="copy">Copy</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssetStatus)}>
              <SelectTrigger className="w-32 rounded-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="revision">Revision</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Channel Overview Strip */}
        <div className="grid grid-cols-5 border-b border-border">
          {channelStats.map((stat) => {
            const config = CHANNEL_CONFIG[stat.channel as keyof typeof CHANNEL_CONFIG];
            if (!config) return null;
            const Icon = config.icon;
            const isActive = channelFilter === stat.channel;
            
            return (
              <Link 
                key={stat.channel} 
                to={config.route}
                className={cn(
                  "p-4 border-r last:border-r-0 border-border transition-colors hover:bg-card/50",
                  isActive && "bg-card"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("w-3 h-3 rounded-none", config.color)} />
                  <Icon className={cn("w-4 h-4", config.textColor)} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.total}</span>
                  <span className="text-xs text-muted-foreground">assets</span>
                </div>
                <div className="flex gap-3 mt-1 text-xs">
                  <span className="text-amber-600">{stat.pending} pending</span>
                  <span className="text-green-600">{stat.approved} approved</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Asset Grid */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No assets found matching your filters
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => {
                const TypeIcon = getAssetTypeIcon(asset);
                const channelConfig = CHANNEL_CONFIG[asset.channel as keyof typeof CHANNEL_CONFIG];
                
                return (
                  <div
                    key={asset.id}
                    className="border border-border p-4 hover:border-primary/30 transition-all hover:shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-none", channelConfig?.color)} />
                        <span className={cn("text-xs font-medium", channelConfig?.textColor)}>
                          {channelConfig?.label}
                        </span>
                      </div>
                      {getStatusBadge(asset)}
                    </div>

                    {/* Content Preview */}
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1">
                        {asset.partner?.company_name || 'Unknown Brand'}
                      </div>
                      {asset.copy_text && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {asset.copy_text}
                        </p>
                      )}
                    </div>

                    {/* Asset Type & Meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TypeIcon className="w-4 h-4" />
                        <span className="text-xs">
                          {asset.file_urls?.length || 0} files
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(asset.updated_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
