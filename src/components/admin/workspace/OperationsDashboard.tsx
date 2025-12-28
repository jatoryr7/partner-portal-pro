import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Brain, 
  FileText, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { ContentInventoryExplorer } from '@/components/admin/workspace/ContentInventoryExplorer';
import { AnalystBriefingDesk } from '@/components/admin/workspace/AnalystBriefingDesk';
import { CallPrepExport } from '@/components/admin/CallPrepExport';
import { InsertionOrdersView } from '@/components/admin/operations/InsertionOrdersView';
import { PerformanceFeedView } from '@/components/admin/operations/PerformanceFeedView';

export function OperationsDashboard() {
  const [activeTab, setActiveTab] = useState('pacing');

  // Fetch stats for performance cards
  const { data: stats } = useQuery({
    queryKey: ['operations-stats'],
    queryFn: async () => {
      // Get signed deals count
      const { data: deals, error: dealsError } = await supabase
        .from('campaign_deals')
        .select('id, deal_value, contract_status')
        .eq('contract_status', 'signed');
      
      if (dealsError) throw dealsError;

      // Get total revenue from operational insights this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: insights, error: insightsError } = await supabase
        .from('operational_insights')
        .select('revenue, partner_id')
        .gte('week_start', startOfMonth.toISOString().split('T')[0]);
      
      if (insightsError) throw insightsError;

      // Get unbooked high-value K1s (available ad units)
      const { data: adUnits, error: adUnitsError } = await supabase
        .from('content_ad_units')
        .select('id, status')
        .eq('status', 'available');
      
      if (adUnitsError) throw adUnitsError;

      // Get partners needing briefings (no insight this week)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('id');
      
      if (partnersError) throw partnersError;

      const { data: recentInsights, error: recentInsightsError } = await supabase
        .from('operational_insights')
        .select('partner_id')
        .gte('week_start', startOfWeek.toISOString().split('T')[0]);
      
      if (recentInsightsError) throw recentInsightsError;

      const partnersWithInsights = new Set(recentInsights?.map(i => i.partner_id) || []);
      const pendingBriefings = (partners || []).filter(p => !partnersWithInsights.has(p.id)).length;

      // Calculate totals
      const totalActiveDeals = deals?.length || 0;
      const totalRevenue = insights?.reduce((sum, i) => sum + (Number(i.revenue) || 0), 0) || 0;
      const monthlyTarget = 500000; // Example target
      const revenuePacing = monthlyTarget > 0 ? (totalRevenue / monthlyTarget) * 100 : 0;
      const atRiskInventory = adUnits?.length || 0;

      return {
        totalActiveDeals,
        totalRevenue,
        revenuePacing,
        atRiskInventory,
        pendingBriefings,
        monthlyTarget,
      };
    },
  });

  return (
    <div className="space-y-6">
      {/* Header with Call Prep Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Operations Hub</h2>
          <p className="text-muted-foreground">Manage inventory, briefings, and campaign performance</p>
        </div>
        <CallPrepExport />
      </div>

      {/* Unified Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Deals</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.totalActiveDeals || 0}</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                Signed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Pacing</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  ${((stats?.totalRevenue || 0) / 1000).toFixed(0)}k
                </span>
                <span className="text-sm text-muted-foreground">
                  / ${((stats?.monthlyTarget || 0) / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(stats?.revenuePacing || 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {(stats?.revenuePacing || 0).toFixed(0)}% of monthly target
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At-Risk Inventory</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.atRiskInventory || 0}</span>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                Unbooked K1s
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">High-value slots available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Briefings</CardTitle>
            <ClipboardList className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.pendingBriefings || 0}</span>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                This Week
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Brands needing analyst update</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="pacing" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Pacing & Inventory</span>
            <span className="sm:hidden">Pacing</span>
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Brand Intelligence</span>
            <span className="sm:hidden">Intel</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Insertion Orders</span>
            <span className="sm:hidden">IOs</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance Feed</span>
            <span className="sm:hidden">Perf</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pacing" className="mt-6">
          <ContentInventoryExplorer />
        </TabsContent>

        <TabsContent value="intelligence" className="mt-6">
          <AnalystBriefingDesk />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <InsertionOrdersView />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceFeedView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
