import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Megaphone, 
  Target, 
  Tv, 
  Mail, 
  PenTool,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelStats {
  channel: string;
  label: string;
  icon: typeof Megaphone;
  totalCampaigns: number;
  assetsReceived: number;
  totalAssetsExpected: number;
  urgentCount: number;
}

const CHANNELS = [
  { key: 'native', label: 'Native', icon: Megaphone },
  { key: 'paid_social_search', label: 'Paid Social/Search', icon: Target },
  { key: 'media', label: 'Media', icon: Tv },
  { key: 'newsletter', label: 'Newsletter', icon: Mail },
  { key: 'content_marketing', label: 'Content Marketing', icon: PenTool },
] as const;

// Assume each campaign expects 10 assets by default (can be made configurable)
const DEFAULT_EXPECTED_ASSETS = 10;

export default function TrackingBar() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['channel-stats'],
    queryFn: async () => {
      // Fetch all partners with their campaign status and creative assets
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select(`
          id,
          company_name,
          target_launch_date,
          campaign_status (
            stage
          ),
          creative_assets (
            channel,
            file_urls
          )
        `);

      if (partnersError) throw partnersError;

      // Calculate stats per channel
      const channelStatsMap = new Map<string, {
        campaigns: number;
        assetsReceived: number;
        urgent: number;
      }>();

      CHANNELS.forEach(({ key }) => {
        channelStatsMap.set(key, {
          campaigns: 0,
          assetsReceived: 0,
          urgent: 0,
        });
      });

      const now = new Date();
      const seventyTwoHours = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

      // Track which partners we've counted per channel to avoid double counting
      const partnersCountedPerChannel = new Map<string, Set<string>>();
      CHANNELS.forEach(({ key }) => {
        partnersCountedPerChannel.set(key, new Set());
      });

      partners?.forEach((partner) => {
        const launchDate = partner.target_launch_date 
          ? new Date(partner.target_launch_date) 
          : null;
        const isUrgent = launchDate && 
          (launchDate.getTime() - now.getTime()) < seventyTwoHours &&
          launchDate.getTime() > now.getTime() &&
          partner.campaign_status?.stage !== 'live';

        // Group assets by channel
        const assetsByChannel = new Map<string, number>();
        partner.creative_assets?.forEach((asset: any) => {
          const count = asset.file_urls?.length || 0;
          const existing = assetsByChannel.get(asset.channel) || 0;
          assetsByChannel.set(asset.channel, existing + count);
        });

        // Update stats for each channel this partner has assets in
        assetsByChannel.forEach((assetCount, channel) => {
          const stats = channelStatsMap.get(channel);
          const countedSet = partnersCountedPerChannel.get(channel);
          
          if (stats && countedSet && !countedSet.has(partner.id)) {
            stats.campaigns += 1;
            stats.assetsReceived += assetCount;
            countedSet.add(partner.id);
            
            if (isUrgent) {
              stats.urgent += 1;
            }
          }
        });
      });

      const stats: ChannelStats[] = CHANNELS.map(({ key, label, icon }) => {
        const channelData = channelStatsMap.get(key) || {
          campaigns: 0,
          assetsReceived: 0,
          urgent: 0,
        };

        return {
          channel: key,
          label,
          icon,
          totalCampaigns: channelData.campaigns,
          assetsReceived: channelData.assetsReceived,
          totalAssetsExpected: channelData.campaigns * DEFAULT_EXPECTED_ASSETS,
          urgentCount: channelData.urgent,
        };
      });

      return stats;
    },
  });

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading campaign stats. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Campaign Tracking</h2>
        <p className="text-sm text-muted-foreground">Monitor active campaigns across all channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats?.map((stat) => {
            const Icon = stat.icon;
            const progress = stat.totalAssetsExpected > 0
              ? (stat.assetsReceived / stat.totalAssetsExpected) * 100
              : 0;
            const isUrgent = stat.urgentCount > 0;

            return (
              <Card
                key={stat.channel}
                className={cn(
                  "transition-shadow hover:shadow-md",
                  isUrgent && "border-destructive border-2"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    </div>
                    {isUrgent && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold">{stat.totalCampaigns}</span>
                      <span className="text-xs text-muted-foreground">campaigns</span>
                    </div>
                    {isUrgent && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        {stat.urgentCount} urgent
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {stat.assetsReceived} / {stat.totalAssetsExpected}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
