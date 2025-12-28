import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextArea } from '@/components/shared/RichTextArea';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Info, 
  Bell,
  ChevronDown,
  ExternalLink,
  Calendar,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { format, parseISO, startOfWeek, isWithinInterval, subDays } from 'date-fns';

interface ExternalResource {
  title: string;
  url: string;
}

interface OperationalInsight {
  id: string;
  partner_id: string;
  created_by: string;
  revenue: number;
  cac: number;
  roas: number;
  spend: number;
  conversions: number;
  inventory_percent: number;
  weekly_blurb: string | null;
  priority_tag: string;
  external_resources: ExternalResource[];
  week_start: string;
  created_at: string;
  updated_at: string;
  partners?: { company_name: string } | null;
}

interface MetricCardProps {
  label: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'percent' | 'number';
}

function MetricCard({ label, value, previousValue, format: formatType = 'number' }: MetricCardProps) {
  const diff = previousValue !== undefined ? ((value - previousValue) / (previousValue || 1)) * 100 : null;
  
  const formatValue = (val: number) => {
    switch (formatType) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">{formatValue(value)}</span>
        {diff !== null && (
          <div className={`flex items-center text-xs ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
            {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            <span>{Math.abs(diff).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PriorityBadge({ tag }: { tag: string }) {
  switch (tag) {
    case 'critical':
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Critical</Badge>;
    case 'action_required':
      return <Badge variant="default" className="gap-1 bg-amber-500"><Bell className="h-3 w-3" />Action Required</Badge>;
    default:
      return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" />FYI</Badge>;
  }
}

interface NewUpdateFormProps {
  partners: { id: string; company_name: string }[];
  onSubmit: (data: Omit<OperationalInsight, 'id' | 'created_at' | 'updated_at' | 'partners'>) => void;
  isSubmitting: boolean;
}

function NewUpdateForm({ partners, onSubmit, isSubmitting }: NewUpdateFormProps) {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState('');
  const [revenue, setRevenue] = useState('');
  const [cac, setCac] = useState('');
  const [roas, setRoas] = useState('');
  const [spend, setSpend] = useState('');
  const [conversions, setConversions] = useState('');
  const [inventoryPercent, setInventoryPercent] = useState('');
  const [weeklyBlurb, setWeeklyBlurb] = useState('');
  const [priorityTag, setPriorityTag] = useState<'critical' | 'fyi' | 'action_required'>('fyi');
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');

  const addResource = () => {
    if (newResourceTitle && newResourceUrl) {
      setResources([...resources, { title: newResourceTitle, url: newResourceUrl }]);
      setNewResourceTitle('');
      setNewResourceUrl('');
    }
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!partnerId || !user?.id) {
      toast({ title: 'Please select a brand', variant: 'destructive' });
      return;
    }

    onSubmit({
      partner_id: partnerId,
      created_by: user.id,
      revenue: parseFloat(revenue) || 0,
      cac: parseFloat(cac) || 0,
      roas: parseFloat(roas) || 0,
      spend: parseFloat(spend) || 0,
      conversions: parseInt(conversions) || 0,
      inventory_percent: parseFloat(inventoryPercent) || 0,
      weekly_blurb: weeklyBlurb || null,
      priority_tag: priorityTag,
      external_resources: resources,
      week_start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Brand</Label>
        <Select value={partnerId} onValueChange={setPartnerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a brand" />
          </SelectTrigger>
          <SelectContent>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Metric Grid</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Revenue</Label>
            <Input type="number" placeholder="0" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">CAC</Label>
            <Input type="number" placeholder="0" value={cac} onChange={(e) => setCac(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">ROAS</Label>
            <Input type="number" step="0.01" placeholder="0" value={roas} onChange={(e) => setRoas(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Spend</Label>
            <Input type="number" placeholder="0" value={spend} onChange={(e) => setSpend(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Conversions</Label>
            <Input type="number" placeholder="0" value={conversions} onChange={(e) => setConversions(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Inventory %</Label>
            <Input type="number" step="0.1" placeholder="0" value={inventoryPercent} onChange={(e) => setInventoryPercent(e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <Label>Weekly Blurb</Label>
        <RichTextArea
          value={weeklyBlurb}
          onChange={setWeeklyBlurb}
          placeholder="Write your weekly insight summary..."
          className="min-h-[120px]"
        />
      </div>

      <div>
        <Label>Priority Tag</Label>
        <Select value={priorityTag} onValueChange={(v) => setPriorityTag(v as typeof priorityTag)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fyi">FYI</SelectItem>
            <SelectItem value="action_required">Action Required</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">External Resources</Label>
        <div className="space-y-2">
          {resources.map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-muted/50 rounded px-3 py-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{r.title}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeResource(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Title" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} className="flex-1" />
            <Input placeholder="URL" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} className="flex-1" />
            <Button variant="outline" size="sm" onClick={addResource}>Add</Button>
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Update'}
      </Button>
    </div>
  );
}

interface InsightTimelineProps {
  insights: OperationalInsight[];
  groupByBrand?: boolean;
}

function InsightTimeline({ insights, groupByBrand = false }: InsightTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([insights[0]?.id]));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Group insights by week_start to calculate trends
  const insightsByPartner = useMemo(() => {
    const grouped: Record<string, OperationalInsight[]> = {};
    insights.forEach((i) => {
      if (!grouped[i.partner_id]) grouped[i.partner_id] = [];
      grouped[i.partner_id].push(i);
    });
    // Sort each group by week_start desc
    Object.values(grouped).forEach((arr) => arr.sort((a, b) => b.week_start.localeCompare(a.week_start)));
    return grouped;
  }, [insights]);

  const getPreviousInsight = (insight: OperationalInsight) => {
    const partnerInsights = insightsByPartner[insight.partner_id] || [];
    const currentIndex = partnerInsights.findIndex((i) => i.id === insight.id);
    return partnerInsights[currentIndex + 1];
  };

  if (insights.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No updates yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, idx) => {
        const isExpanded = expandedIds.has(insight.id);
        const previousInsight = getPreviousInsight(insight);

        return (
          <Collapsible key={insight.id} open={isExpanded} onOpenChange={() => toggleExpand(insight.id)}>
            <Card className={`transition-all ${insight.priority_tag === 'critical' ? 'border-destructive/50 bg-destructive/5' : ''}`}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-sm font-medium">
                          Week of {format(parseISO(insight.week_start), 'MMM d, yyyy')}
                        </CardTitle>
                        {groupByBrand && insight.partners && (
                          <p className="text-xs text-muted-foreground">{insight.partners.company_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge tag={insight.priority_tag} />
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MetricCard label="Revenue" value={insight.revenue} previousValue={previousInsight?.revenue} format="currency" />
                    <MetricCard label="CAC" value={insight.cac} previousValue={previousInsight?.cac} format="currency" />
                    <MetricCard label="ROAS" value={insight.roas} previousValue={previousInsight?.roas} />
                    <MetricCard label="Spend" value={insight.spend} previousValue={previousInsight?.spend} format="currency" />
                    <MetricCard label="Conversions" value={insight.conversions} previousValue={previousInsight?.conversions} />
                    <MetricCard label="Inventory %" value={insight.inventory_percent} previousValue={previousInsight?.inventory_percent} format="percent" />
                  </div>

                  {insight.weekly_blurb && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: insight.weekly_blurb }} />
                    </div>
                  )}

                  {insight.external_resources && insight.external_resources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.external_resources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {r.title}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}

export function AnalystBriefingDesk() {
  const queryClient = useQueryClient();
  const [isNewUpdateOpen, setIsNewUpdateOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');

  // Fetch partners
  const { data: partners = [] } = useQuery({
    queryKey: ['partners-for-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch insights
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['operational-insights', selectedPartnerId],
    queryFn: async () => {
      let query = supabase
        .from('operational_insights')
        .select('*, partners(company_name)')
        .order('week_start', { ascending: false });

      if (selectedPartnerId !== 'all') {
        query = query.eq('partner_id', selectedPartnerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform data to match our interface
      return (data || []).map((item) => ({
        ...item,
        external_resources: Array.isArray(item.external_resources) 
          ? (item.external_resources as unknown as ExternalResource[]) 
          : [],
      })) as unknown as OperationalInsight[];
    },
  });

  // Critical insights from last 7 days
  const criticalInsights = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return insights.filter(
      (i) =>
        i.priority_tag === 'critical' &&
        isWithinInterval(parseISO(i.created_at), { start: sevenDaysAgo, end: new Date() })
    );
  }, [insights]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<OperationalInsight, 'id' | 'created_at' | 'updated_at' | 'partners'>) => {
      const { error } = await supabase.from('operational_insights').insert([{
        partner_id: data.partner_id,
        created_by: data.created_by,
        revenue: data.revenue,
        cac: data.cac,
        roas: data.roas,
        spend: data.spend,
        conversions: data.conversions,
        inventory_percent: data.inventory_percent,
        weekly_blurb: data.weekly_blurb,
        priority_tag: data.priority_tag,
        external_resources: JSON.parse(JSON.stringify(data.external_resources)),
        week_start: data.week_start,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-insights'] });
      setIsNewUpdateOpen(false);
      toast({ title: 'Update submitted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to submit update', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analyst Briefing Desk</h2>
          <p className="text-sm text-muted-foreground">Weekly performance updates and insights</p>
        </div>
        <Dialog open={isNewUpdateOpen} onOpenChange={setIsNewUpdateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Weekly Update</DialogTitle>
            </DialogHeader>
            <NewUpdateForm
              partners={partners}
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Critical Alerts Banner */}
      {criticalInsights.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Critical Updates (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalInsights.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{i.partners?.company_name}</span>
                  <span className="text-muted-foreground">{format(parseISO(i.week_start), 'MMM d')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand Filter */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Split-View Layout: The Pulse (Left) + The Briefing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: The Pulse - Latest Metrics */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              📊 The Pulse
              <span className="text-sm font-normal text-muted-foreground">Latest Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {/* Latest metrics from most recent insight */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <MetricCard 
                    label="Revenue" 
                    value={insights[0].revenue} 
                    previousValue={insights[1]?.revenue} 
                    format="currency" 
                  />
                  <MetricCard 
                    label="CAC" 
                    value={insights[0].cac} 
                    previousValue={insights[1]?.cac} 
                    format="currency" 
                  />
                  <MetricCard 
                    label="ROAS" 
                    value={insights[0].roas} 
                    previousValue={insights[1]?.roas} 
                  />
                  <MetricCard 
                    label="Spend" 
                    value={insights[0].spend} 
                    previousValue={insights[1]?.spend} 
                    format="currency" 
                  />
                  <MetricCard 
                    label="Conversions" 
                    value={insights[0].conversions} 
                    previousValue={insights[1]?.conversions} 
                  />
                  <MetricCard 
                    label="Inventory %" 
                    value={insights[0].inventory_percent} 
                    previousValue={insights[1]?.inventory_percent} 
                    format="percent" 
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Week of {format(parseISO(insights[0].week_start), 'MMM d, yyyy')}
                  {insights[0].partners && ` • ${insights[0].partners.company_name}`}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No metrics data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Pane: The Briefing - Weekly Blurbs Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🧠 The Briefing
              <span className="text-sm font-normal text-muted-foreground">Weekly Blurbs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : insights.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {insights.slice(0, 10).map((insight) => (
                    <div 
                      key={insight.id}
                      className={`p-4 rounded-lg border ${
                        insight.priority_tag === 'critical' 
                          ? 'border-destructive/50 bg-destructive/5' 
                          : insight.priority_tag === 'action_required'
                          ? 'border-amber-500/50 bg-amber-500/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Week of {format(parseISO(insight.week_start), 'MMM d')}
                          </span>
                          {insight.partners && (
                            <span className="text-xs font-medium">
                              • {insight.partners.company_name}
                            </span>
                          )}
                        </div>
                        <PriorityBadge tag={insight.priority_tag} />
                      </div>
                      {insight.weekly_blurb ? (
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: insight.weekly_blurb }} 
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No blurb provided</p>
                      )}
                      {insight.external_resources && insight.external_resources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t">
                          {insight.external_resources.map((r, i) => (
                            <a
                              key={i}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {r.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No updates yet</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Full Timeline (Collapsible) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Full Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <InsightTimeline insights={insights} groupByBrand={selectedPartnerId === 'all'} />
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
