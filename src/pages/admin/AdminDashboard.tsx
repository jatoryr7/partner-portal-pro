import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Megaphone, 
  Target, 
  Tv, 
  Mail, 
  PenTool,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { TeamWorkspaceToggle, TeamWorkspace } from '@/components/admin/TeamWorkspaceToggle';
import { MarketingDashboard } from '@/components/admin/workspace/MarketingDashboard';
import { LegalDashboard } from '@/components/admin/workspace/LegalDashboard';
import { CreativeDashboard } from '@/components/admin/workspace/CreativeDashboard';
import { BusinessDevDashboard } from '@/components/admin/workspace/BusinessDevDashboard';
import { OperationsDashboard } from '@/components/admin/workspace/OperationsDashboard';
import { PartnerManagementDashboard } from '@/components/admin/workspace/PartnerManagementDashboard';
import { ContentInventoryDashboard } from '@/components/admin/workspace/ContentInventoryDashboard';

interface ChannelStats {
  channel: string;
  total: number;
  pending: number;
  approved: number;
  needsRevision: number;
}

export default function AdminDashboard() {
  const [activeWorkspace, setActiveWorkspace] = useState<TeamWorkspace>('marketing');

  const { data: partnerCount = 0 } = useQuery({
    queryKey: ['partner-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: channelStats = [] } = useQuery({
    queryKey: ['channel-stats'],
    queryFn: async () => {
      const { data: assets } = await supabase
        .from('creative_assets')
        .select(`
          channel,
          asset_feedback (status)
        `);

      if (!assets) return [];

      const channels = ['native', 'paid_social_search', 'media', 'newsletter', 'content_marketing'];
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

  const channelConfig = {
    native: { label: 'Native', icon: Megaphone, route: '/admin/native' },
    paid_social_search: { label: 'Paid Social/Search', icon: Target, route: '/admin/paid-social' },
    media: { label: 'Media', icon: Tv, route: '/admin/media' },
    newsletter: { label: 'Newsletter', icon: Mail, route: '/admin/newsletter' },
    content_marketing: { label: 'Content Marketing', icon: PenTool, route: '/admin/content-marketing' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor partner submissions and asset status</p>
        </div>
        <TeamWorkspaceToggle
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={setActiveWorkspace}
        />
      </div>

      {/* Render workspace-specific dashboard */}
      {activeWorkspace === 'marketing' && <MarketingDashboard />}
      {activeWorkspace === 'legal' && <LegalDashboard />}
      {activeWorkspace === 'creative' && <CreativeDashboard />}
      {activeWorkspace === 'business_dev' && <BusinessDevDashboard />}
      {activeWorkspace === 'operations' && <OperationsDashboard />}
      {activeWorkspace === 'partner_mgmt' && <PartnerManagementDashboard />}
      {activeWorkspace === 'content_inventory' && <ContentInventoryDashboard />}

      {/* Original Summary Cards - always visible */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Channel Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{partnerCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                <span className="text-2xl font-bold">
                  {channelStats.reduce((acc, s) => acc + s.pending, 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-2xl font-bold">
                  {channelStats.reduce((acc, s) => acc + s.approved, 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs Revision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-bold">
                  {channelStats.reduce((acc, s) => acc + s.needsRevision, 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelStats.map((stat) => {
            const config = channelConfig[stat.channel as keyof typeof channelConfig];
            if (!config) return null;
            
            const Icon = config.icon;
            
            return (
              <Link key={stat.channel} to={config.route}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">{config.label}</CardTitle>
                      </div>
                      <Badge variant="secondary">{stat.total} assets</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-warning" />
                        <span className="text-muted-foreground">{stat.pending} pending</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-muted-foreground">{stat.approved} approved</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-muted-foreground">{stat.needsRevision} revision</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
