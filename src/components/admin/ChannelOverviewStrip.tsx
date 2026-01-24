import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone,
  Target,
  Tv,
  Mail,
  PenTool,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Channel configuration with Pulse & Precision aesthetic
const CHANNEL_CONFIG = {
  native: { 
    label: 'Native', 
    icon: Megaphone, 
    color: 'bg-orange-500', 
    textColor: 'text-orange-600',
    route: '/admin/native',
    lightBg: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  paid_social_search: { 
    label: 'Paid Social', 
    icon: Target, 
    color: 'bg-blue-500', 
    textColor: 'text-blue-600',
    route: '/admin/paid-social',
    lightBg: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  media: { 
    label: 'Media', 
    icon: Tv, 
    color: 'bg-purple-500', 
    textColor: 'text-purple-600',
    route: '/admin/media',
    lightBg: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  newsletter: { 
    label: 'Newsletter', 
    icon: Mail, 
    color: 'bg-green-500', 
    textColor: 'text-green-600',
    route: '/admin/newsletter',
    lightBg: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  content_marketing: { 
    label: 'Content', 
    icon: PenTool, 
    color: 'bg-teal-500', 
    textColor: 'text-teal-600',
    route: '/admin/content-marketing',
    lightBg: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30'
  },
};

interface ChannelOverviewStripProps {
  activeChannel?: string;
  showOnlyActive?: boolean;
  compact?: boolean;
}

export function ChannelOverviewStrip({ 
  activeChannel, 
  showOnlyActive = false,
  compact = false 
}: ChannelOverviewStripProps) {
  const { data: channelStats = [] } = useQuery({
    queryKey: ['channel-overview-stats'],
    queryFn: async () => {
      const { data: assets } = await supabase
        .from('creative_assets')
        .select(`
          channel,
          asset_feedback (status)
        `);

      if (!assets) return [];

      const channels = Object.keys(CHANNEL_CONFIG);
      return channels.map((channel) => {
        const channelAssets = assets.filter((a) => a.channel === channel);
        return {
          channel,
          total: channelAssets.length,
          pending: channelAssets.filter((a) => !a.asset_feedback?.length).length,
          approved: channelAssets.filter((a) => a.asset_feedback?.[0]?.status === 'approved').length,
          needsRevision: channelAssets.filter((a) => a.asset_feedback?.[0]?.status === 'needs_revision').length,
        };
      });
    },
  });

  const displayChannels = showOnlyActive && activeChannel 
    ? channelStats.filter(s => s.channel === activeChannel)
    : channelStats;

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {displayChannels.map((stat) => {
          const config = CHANNEL_CONFIG[stat.channel as keyof typeof CHANNEL_CONFIG];
          if (!config) return null;
          const Icon = config.icon;
          const isActive = activeChannel === stat.channel;
          
          return (
            <Link key={stat.channel} to={config.route}>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 border transition-all hover:shadow-sm",
                isActive ? config.borderColor : "border-border",
                isActive && config.lightBg
              )}>
                <span className={cn("w-2 h-2 rounded-none", config.color)} />
                <Icon className={cn("w-4 h-4", config.textColor)} />
                <span className="text-sm font-medium whitespace-nowrap">{config.label}</span>
                <Badge variant="outline" className="rounded-none text-xs ml-1">
                  {stat.total}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="rounded-none border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Channel Overview
          </CardTitle>
          {activeChannel && (
            <Badge variant="outline" className="rounded-none text-xs">
              Filtered: {CHANNEL_CONFIG[activeChannel as keyof typeof CHANNEL_CONFIG]?.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {displayChannels.map((stat) => {
            const config = CHANNEL_CONFIG[stat.channel as keyof typeof CHANNEL_CONFIG];
            if (!config) return null;
            const Icon = config.icon;
            const isActive = activeChannel === stat.channel;
            
            return (
              <Link key={stat.channel} to={config.route}>
                <div className={cn(
                  "p-4 border transition-all hover:shadow-sm group",
                  isActive ? cn(config.borderColor, config.lightBg) : "border-border hover:border-primary/30"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-3 h-3 rounded-none", config.color)} />
                      <Icon className={cn("w-5 h-5", config.textColor)} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold">{stat.total}</span>
                    <span className="text-xs text-muted-foreground">assets</span>
                  </div>
                  
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-none bg-amber-500" />
                      <span className="text-muted-foreground">{stat.pending}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-none bg-green-500" />
                      <span className="text-muted-foreground">{stat.approved}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-none bg-red-500" />
                      <span className="text-muted-foreground">{stat.needsRevision}</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
