import { useState, useEffect } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AssetCard from './AssetCard';
import { FeedbackStatus } from '@/types/campaign';

interface ChannelViewProps {
  channel: string;
  channelLabel: string;
  filterField?: 'affiliate_platform' | 'media_platform';
  filterOptions?: string[];
}

interface AssetWithPartner {
  id: string;
  partner_id: string;
  affiliate_link: string | null;
  affiliate_platform: string | null;
  driver_types: string[] | null;
  promo_copy: string | null;
  context_instructions: string | null;
  copy_text: string | null;
  file_urls: string[] | null;
  created_at: string;
  partners: {
    company_name: string;
  } | null;
  asset_feedback: {
    status: string;
    comments: string | null;
  }[] | null;
}

export default function ChannelView({ 
  channel, 
  channelLabel, 
  filterField,
  filterOptions = [] 
}: ChannelViewProps) {
  const [assets, setAssets] = useState<AssetWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchAssets();
  }, [channel]);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('creative_assets')
      .select(`
        *,
        partners (company_name),
        asset_feedback (status, comments)
      `)
      .eq('channel', channel)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading assets',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setAssets(data || []);
    }
    setLoading(false);
  };

  const handleFeedbackChange = async (assetId: string, status: FeedbackStatus, comments?: string) => {
    // Check if feedback exists
    const { data: existing } = await supabase
      .from('asset_feedback')
      .select('id')
      .eq('asset_id', assetId)
      .single();

    if (existing) {
      await supabase
        .from('asset_feedback')
        .update({ status, comments: comments || null })
        .eq('asset_id', assetId);
    } else {
      await supabase
        .from('asset_feedback')
        .insert({ asset_id: assetId, status, comments: comments || null });
    }

    toast({
      title: status === 'approved' ? 'Asset Approved' : 'Revision Requested',
      description: status === 'approved' 
        ? 'The partner has been notified.'
        : 'Your feedback has been sent to the partner.',
    });

    fetchAssets();
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = !searchTerm || 
      asset.partners?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterValue === 'all' || 
      (filterField === 'affiliate_platform' && asset.affiliate_platform === filterValue) ||
      (filterField === 'media_platform' && asset.copy_text === filterValue);
    
    const feedback = asset.asset_feedback?.[0];
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && !feedback) ||
      feedback?.status === statusFilter;

    return matchesSearch && matchesFilter && matchesStatus;
  });

  const handleDownloadAll = () => {
    toast({
      title: 'Preparing download...',
      description: 'Zip file will be generated with renamed assets.',
    });
    // TODO: Implement edge function for zip generation
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {filterField && filterOptions.length > 0 && (
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {filterOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleDownloadAll}>
          <Download className="w-4 h-4 mr-2" />
          Download Zip
        </Button>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No assets found for {channelLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              id={asset.id}
              partnerName={asset.partners?.company_name || 'Unknown'}
              channel={channel}
              affiliateLink={asset.affiliate_link || undefined}
              affiliatePlatform={asset.affiliate_platform || undefined}
              driverTypes={asset.driver_types || undefined}
              promoCopy={asset.promo_copy || undefined}
              contextInstructions={asset.context_instructions || undefined}
              fileUrls={asset.file_urls || []}
              feedbackStatus={(asset.asset_feedback?.[0]?.status as FeedbackStatus) || 'pending'}
              feedbackComments={asset.asset_feedback?.[0]?.comments || undefined}
              createdAt={new Date(asset.created_at)}
              onFeedbackChange={handleFeedbackChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
