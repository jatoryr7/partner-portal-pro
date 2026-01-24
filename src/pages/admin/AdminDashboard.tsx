import { useState } from 'react';
import TrackingBar from '@/components/admin/dashboard/TrackingBar';
import UnifiedSubmissions from '@/components/admin/dashboard/UnifiedSubmissions';
import SalesPipelineSheet from '@/components/admin/dashboard/SalesPipelineSheet';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Unified view of all campaigns and submissions across all channels
          </p>
        </div>
        <Button
          onClick={() => setIsPipelineOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          View Pipeline
        </Button>
      </div>

      <TrackingBar />
      <UnifiedSubmissions />

      <SalesPipelineSheet
        open={isPipelineOpen}
        onOpenChange={setIsPipelineOpen}
      />
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Clock,
  DollarSign
} from 'lucide-react';
import { TeamWorkspaceToggle, TeamWorkspace } from '@/components/admin/TeamWorkspaceToggle';
import { MarketingDashboard } from '@/components/admin/workspace/MarketingDashboard';
import { LegalDashboard } from '@/components/admin/workspace/LegalDashboard';
import { CreativeDashboard } from '@/components/admin/workspace/CreativeDashboard';
import { BusinessDevDashboard } from '@/components/admin/workspace/BusinessDevDashboard';
import { OperationsDashboard } from '@/components/admin/workspace/OperationsDashboard';
import { PartnerManagementDashboard } from '@/components/admin/workspace/PartnerManagementDashboard';
import { ContentInventoryExplorer } from '@/components/admin/workspace/ContentInventoryExplorer';

// Map legacy workspace names to current ones
const WORKSPACE_ALIASES: Record<string, TeamWorkspace> = {
  'business_dev': 'sales_bd',
};

const VALID_WORKSPACES: TeamWorkspace[] = ['sales_bd', 'operations', 'inventory', 'partner_success', 'marketing', 'legal', 'creative'];

function normalizeWorkspace(param: string | null): TeamWorkspace {
  if (!param) return 'sales_bd';
  // Check if it's an alias
  if (WORKSPACE_ALIASES[param]) return WORKSPACE_ALIASES[param];
  // Check if it's a valid workspace
  if (VALID_WORKSPACES.includes(param as TeamWorkspace)) return param as TeamWorkspace;
  // Default fallback
  return 'sales_bd';
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceParam = searchParams.get('workspace');
  const [activeWorkspace, setActiveWorkspace] = useState<TeamWorkspace>(() => normalizeWorkspace(workspaceParam));

  // Sync workspace with URL params
  useEffect(() => {
    const normalized = normalizeWorkspace(workspaceParam);
    if (normalized !== activeWorkspace) {
      setActiveWorkspace(normalized);
    }
  }, [workspaceParam]);

  const handleWorkspaceChange = (workspace: TeamWorkspace) => {
    setActiveWorkspace(workspace);
    setSearchParams({ workspace });
  };

  const { data: partnerCount = 0 } = useQuery({
    queryKey: ['partner-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: totalRevenue = 0 } = useQuery({
    queryKey: ['total-revenue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('campaign_deals')
        .select('deal_value');
      return data?.reduce((acc, d) => acc + (d.deal_value || 0), 0) || 0;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header with Workspace Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground">Unified workspace for all team functions</p>
        </div>
        <TeamWorkspaceToggle
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
        />
      </div>

      {/* Key Metrics - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Brands
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
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalRevenue)}</span>
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
              <Clock className="w-5 h-5 text-amber-500" />
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
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">
                {channelStats.reduce((acc, s) => acc + s.approved, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Render workspace-specific dashboard */}
      <div className="pt-4">
        {activeWorkspace === 'sales_bd' && <BusinessDevDashboard />}
        {activeWorkspace === 'operations' && <OperationsDashboard />}
        {activeWorkspace === 'inventory' && <ContentInventoryExplorer />}
        {activeWorkspace === 'partner_success' && <PartnerManagementDashboard />}
        {activeWorkspace === 'marketing' && <MarketingDashboard />}
        {activeWorkspace === 'legal' && <LegalDashboard />}
        {activeWorkspace === 'creative' && <CreativeDashboard />}
      </div>

      {/* Channel Overview - Always visible at bottom */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Channel Overview</h3>
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
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">{stat.pending} pending</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">{stat.approved} approved</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
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
