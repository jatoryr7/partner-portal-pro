import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign, 
  Target, 
  Users,
  Search,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { format, parseISO, subWeeks, isAfter } from 'date-fns';

interface PerformanceData {
  id: string;
  partner_id: string;
  revenue: number;
  cac: number;
  roas: number;
  spend: number;
  conversions: number;
  week_start: string;
  partners: {
    company_name: string;
  } | null;
}

interface AggregatedBrandPerformance {
  partnerId: string;
  companyName: string;
  currentRevenue: number;
  previousRevenue: number;
  currentCac: number;
  previousCac: number;
  currentRoas: number;
  previousRoas: number;
  currentSpend: number;
  previousSpend: number;
  currentConversions: number;
  previousConversions: number;
}

export function PerformanceFeedView() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'roas' | 'cac'>('revenue');

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['performance-feed'],
    queryFn: async () => {
      const fourWeeksAgo = subWeeks(new Date(), 4);
      const { data, error } = await supabase
        .from('operational_insights')
        .select('id, partner_id, revenue, cac, roas, spend, conversions, week_start, partners(company_name)')
        .gte('week_start', fourWeeksAgo.toISOString().split('T')[0])
        .order('week_start', { ascending: false });
      if (error) throw error;
      return data as PerformanceData[];
    },
  });

  // Aggregate by brand with current vs previous week comparison
  const aggregatedData = useMemo(() => {
    const oneWeekAgo = subWeeks(new Date(), 1);
    const twoWeeksAgo = subWeeks(new Date(), 2);

    const byPartner: Record<string, AggregatedBrandPerformance> = {};

    insights.forEach((insight) => {
      if (!byPartner[insight.partner_id]) {
        byPartner[insight.partner_id] = {
          partnerId: insight.partner_id,
          companyName: insight.partners?.company_name || 'Unknown',
          currentRevenue: 0,
          previousRevenue: 0,
          currentCac: 0,
          previousCac: 0,
          currentRoas: 0,
          previousRoas: 0,
          currentSpend: 0,
          previousSpend: 0,
          currentConversions: 0,
          previousConversions: 0,
        };
      }

      const weekDate = parseISO(insight.week_start);
      const isCurrent = isAfter(weekDate, oneWeekAgo);
      const isPrevious = isAfter(weekDate, twoWeeksAgo) && !isCurrent;

      if (isCurrent) {
        byPartner[insight.partner_id].currentRevenue += Number(insight.revenue) || 0;
        byPartner[insight.partner_id].currentCac = Number(insight.cac) || 0;
        byPartner[insight.partner_id].currentRoas = Number(insight.roas) || 0;
        byPartner[insight.partner_id].currentSpend += Number(insight.spend) || 0;
        byPartner[insight.partner_id].currentConversions += Number(insight.conversions) || 0;
      } else if (isPrevious) {
        byPartner[insight.partner_id].previousRevenue += Number(insight.revenue) || 0;
        byPartner[insight.partner_id].previousCac = Number(insight.cac) || 0;
        byPartner[insight.partner_id].previousRoas = Number(insight.roas) || 0;
        byPartner[insight.partner_id].previousSpend += Number(insight.spend) || 0;
        byPartner[insight.partner_id].previousConversions += Number(insight.conversions) || 0;
      }
    });

    return Object.values(byPartner);
  }, [insights]);

  // Filter and sort
  const filteredData = useMemo(() => {
    let result = aggregatedData.filter((item) =>
      item.companyName.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.currentRevenue - a.currentRevenue;
        case 'roas':
          return b.currentRoas - a.currentRoas;
        case 'cac':
          return a.currentCac - b.currentCac; // Lower CAC is better
        default:
          return 0;
      }
    });

    return result;
  }, [aggregatedData, search, sortBy]);

  // Overall stats
  const totalRevenue = aggregatedData.reduce((sum, d) => sum + d.currentRevenue, 0);
  const avgRoas = aggregatedData.length > 0 
    ? aggregatedData.reduce((sum, d) => sum + d.currentRoas, 0) / aggregatedData.length 
    : 0;
  const avgCac = aggregatedData.length > 0
    ? aggregatedData.reduce((sum, d) => sum + d.currentCac, 0) / aggregatedData.length
    : 0;
  const totalConversions = aggregatedData.reduce((sum, d) => sum + d.currentConversions, 0);

  const getChangeIndicator = (current: number, previous: number, inverse = false) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    const isPositive = inverse ? change < 0 : change > 0;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}k</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This week across all brands</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{avgRoas.toFixed(2)}x</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Return on ad spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">${avgCac.toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Customer acquisition cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{totalConversions.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Sort by Revenue</SelectItem>
            <SelectItem value="roas">Sort by ROAS</SelectItem>
            <SelectItem value="cac">Sort by CAC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading performance data...
            </CardContent>
          </Card>
        ) : filteredData.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              No performance data found
            </CardContent>
          </Card>
        ) : (
          filteredData.map((brand) => (
            <Card key={brand.partnerId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{brand.companyName}</CardTitle>
                  {brand.currentRoas >= 3 ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      High Performer
                    </Badge>
                  ) : brand.currentRoas < 1 ? (
                    <Badge variant="destructive" className="bg-destructive/10">
                      Needs Review
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        ${brand.currentRevenue.toLocaleString()}
                      </span>
                      {getChangeIndicator(brand.currentRevenue, brand.previousRevenue)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{brand.currentRoas.toFixed(2)}x</span>
                      {getChangeIndicator(brand.currentRoas, brand.previousRoas)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">CAC</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">${brand.currentCac.toFixed(0)}</span>
                      {getChangeIndicator(brand.currentCac, brand.previousCac, true)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{brand.currentConversions}</span>
                      {getChangeIndicator(brand.currentConversions, brand.previousConversions)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spend</span>
                    <span className="font-medium">${brand.currentSpend.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
