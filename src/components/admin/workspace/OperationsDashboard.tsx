import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Brain, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  Receipt,
  Microscope,
  ExternalLink,
  Stethoscope,
  DollarSign
} from 'lucide-react';
import { ContentInventoryExplorer } from '@/components/admin/workspace/ContentInventoryExplorer';
import { AnalystBriefingDesk } from '@/components/admin/workspace/AnalystBriefingDesk';
import { CallPrepExport } from '@/components/admin/CallPrepExport';
import { InsertionOrdersView } from '@/components/admin/operations/InsertionOrdersView';
import { PerformanceFeedView } from '@/components/admin/operations/PerformanceFeedView';
import { MonthlyBillablesView } from '@/components/admin/billables/MonthlyBillablesView';
import { getVisibleSubTabs, type ViewRole } from '@/components/admin/SmartSelector';
import { cn } from '@/lib/utils';

interface OutletContext {
  activeViewRole: ViewRole | null;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

const allTabs = [
  { id: 'pacing', label: 'Pacing', icon: BarChart3, shortLabel: 'Pacing' },
  { id: 'intelligence', label: 'Intel', icon: Brain, shortLabel: 'Intel' },
  { id: 'orders', label: 'IOs', icon: FileText, shortLabel: 'IOs' },
  { id: 'performance', label: 'Perf', icon: TrendingUp, shortLabel: 'Perf' },
  { id: 'billables', label: 'Billables', icon: Receipt, shortLabel: 'Billables' },
];

export function OperationsDashboard() {
  const navigate = useNavigate();
  const context = useOutletContext<OutletContext>();
  const activeViewRole = context?.activeViewRole ?? null;
  const activeTab = context?.activeSubTab ?? 'pacing';
  const setActiveTab = context?.setActiveSubTab ?? (() => {});

  // Get visible tabs based on role
  const visibleTabIds = useMemo(() => getVisibleSubTabs(activeViewRole), [activeViewRole]);
  const visibleTabs = useMemo(() => 
    allTabs.filter(tab => visibleTabIds.includes(tab.id)),
    [visibleTabIds]
  );

  // Auto-select first visible tab if current is hidden
  useEffect(() => {
    if (!visibleTabIds.includes(activeTab) && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabIds, activeTab, visibleTabs, setActiveTab]);

  // Fetch stats for performance cards
  const { data: stats } = useQuery({
    queryKey: ['operations-stats'],
    queryFn: async () => {
      const { data: deals } = await supabase
        .from('campaign_deals')
        .select('id, deal_value, contract_status')
        .eq('contract_status', 'signed');

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: insights } = await supabase
        .from('operational_insights')
        .select('revenue, partner_id')
        .gte('week_start', startOfMonth.toISOString().split('T')[0]);

      const { data: adUnits } = await supabase
        .from('content_ad_units')
        .select('id, status')
        .eq('status', 'available');

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: partners } = await supabase.from('partners').select('id');
      const { data: recentInsights } = await supabase
        .from('operational_insights')
        .select('partner_id')
        .gte('week_start', startOfWeek.toISOString().split('T')[0]);

      const partnersWithInsights = new Set(recentInsights?.map(i => i.partner_id) || []);
      const pendingBriefings = (partners || []).filter(p => !partnersWithInsights.has(p.id)).length;

      const totalActiveDeals = deals?.length || 0;
      const totalRevenue = insights?.reduce((sum, i) => sum + (Number(i.revenue) || 0), 0) || 0;
      const monthlyTarget = 500000;
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

  // Get role-specific header
  const getHeaderContent = () => {
    switch (activeViewRole) {
      case 'accounting':
        return {
          title: 'Billables Center',
          subtitle: 'Monthly reconciliation, payouts & disputes',
        };
      case 'medical':
        return {
          title: 'Medical Review Center',
          subtitle: 'Clinical evaluations & compliance scoring',
        };
      case 'analyst':
        return {
          title: 'Analytics Hub',
          subtitle: 'Performance metrics, briefings & insights',
        };
      default:
        return {
          title: 'Operations Hub',
          subtitle: 'Manage inventory, briefings, and campaign performance',
        };
    }
  };

  const header = getHeaderContent();

  // Show focused stats based on role
  const shouldShowStats = !activeViewRole || activeViewRole === 'executive' || activeViewRole === 'analyst';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background py-2 -mt-2 -mx-1 px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-scientific">{header.title}</h2>
          <p className="text-muted-foreground">{header.subtitle}</p>
        </div>
        <CallPrepExport />
      </div>

      {/* Quick-Jump Chips for Analyst View */}
      {activeViewRole === 'analyst' && activeTab === 'intelligence' && (
        <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-none">
          <span className="text-sm font-medium text-blue-600 mr-2">Quick Jump:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('medical')}
            className="gap-2 rounded-none border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
          >
            <Stethoscope className="w-4 h-4" />
            Medical Reviews
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('billables')}
            className="gap-2 rounded-none border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
          >
            <DollarSign className="w-4 h-4" />
            Billables
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Performance Cards - Only show for relevant roles */}
      {shouldShowStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Deals</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats?.totalActiveDeals || 0}</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 rounded-none">
                  Signed
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
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
                <div className="w-full bg-muted h-2">
                  <div 
                    className="bg-primary h-2 transition-all" 
                    style={{ width: `${Math.min(stats?.revenuePacing || 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.revenuePacing || 0).toFixed(0)}% of monthly target
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">At-Risk Inventory</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats?.atRiskInventory || 0}</span>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 rounded-none">
                  Unbooked K1s
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">High-value slots available</p>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Briefings</CardTitle>
              <ClipboardList className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats?.pendingBriefings || 0}</span>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 rounded-none">
                  This Week
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Brands needing analyst update</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs - Filtered by Role */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {visibleTabs.length > 1 && (
          <TabsList className={cn(
            "grid w-full max-w-4xl rounded-none",
            `grid-cols-${Math.min(visibleTabs.length, 6)}`
          )} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="gap-2 rounded-none"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

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

        <TabsContent value="billables" className="mt-6">
          <MonthlyBillablesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
