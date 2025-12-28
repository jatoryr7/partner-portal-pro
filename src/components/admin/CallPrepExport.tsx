import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, TrendingUp, TrendingDown, Minus, AlertTriangle, Bell, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface CallPrepExportProps {
  partnerId?: string;
  partnerName?: string;
}

interface ExternalResource {
  title: string;
  url: string;
}

interface OperationalInsight {
  id: string;
  partner_id: string;
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
}

interface Stakeholder {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
}

interface ContentArticle {
  id: string;
  title: string;
  status: string;
}

export function CallPrepExport({ partnerId, partnerName }: CallPrepExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(partnerId || '');
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch partners list if no partnerId provided
  const { data: partners = [] } = useQuery({
    queryKey: ['partners-for-call-prep'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data;
    },
    enabled: !partnerId,
  });

  const activePartnerId = partnerId || selectedPartnerId;
  const activePartnerName = partnerName || partners.find(p => p.id === selectedPartnerId)?.company_name || 'Unknown Brand';

  // Fetch latest insights for the partner
  const { data: insights = [] } = useQuery({
    queryKey: ['call-prep-insights', activePartnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_insights')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('week_start', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        external_resources: Array.isArray(item.external_resources) 
          ? (item.external_resources as unknown as ExternalResource[]) 
          : [],
      })) as OperationalInsight[];
    },
    enabled: !!activePartnerId,
  });

  // Fetch stakeholders
  const { data: stakeholders = [] } = useQuery({
    queryKey: ['call-prep-stakeholders', activePartnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*')
        .eq('partner_id', activePartnerId);
      if (error) throw error;
      return data as Stakeholder[];
    },
    enabled: !!activePartnerId,
  });

  // Fetch content articles for inventory status (using content_articles linked to deals)
  const { data: inventoryStatus } = useQuery({
    queryKey: ['call-prep-inventory', activePartnerId],
    queryFn: async () => {
      // Get deals for this partner
      const { data: deals, error: dealsError } = await supabase
        .from('campaign_deals')
        .select('id')
        .eq('partner_id', activePartnerId);
      
      if (dealsError) throw dealsError;
      
      const dealIds = deals?.map(d => d.id) || [];
      
      if (dealIds.length === 0) {
        return { booked: 0, available: 0, pitched: 0 };
      }

      // Get ad units linked to these deals
      const { data: adUnits, error: unitsError } = await supabase
        .from('content_ad_units')
        .select('status, deal_id');
      
      if (unitsError) throw unitsError;

      const booked = adUnits?.filter(u => u.status === 'booked' && dealIds.includes(u.deal_id || '')).length || 0;
      const available = adUnits?.filter(u => u.status === 'available').length || 0;
      const pitched = adUnits?.filter(u => u.status === 'pitched').length || 0;

      return { booked, available, pitched };
    },
    enabled: !!activePartnerId,
  });

  const latestInsight = insights[0];
  const previousInsight = insights[1];

  // Get 3 most recent blurbs, prioritizing critical
  const recentBlurbs = [...insights]
    .sort((a, b) => {
      // Critical first
      if (a.priority_tag === 'critical' && b.priority_tag !== 'critical') return -1;
      if (b.priority_tag === 'critical' && a.priority_tag !== 'critical') return 1;
      // Then by date
      return b.week_start.localeCompare(a.week_start);
    })
    .slice(0, 3);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getMetricTrend = (current: number, previous: number | undefined) => {
    if (!previous) return null;
    const diff = ((current - previous) / (previous || 1)) * 100;
    return { diff, isUp: diff > 0, isDown: diff < 0 };
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Call Prep Summary - ${activePartnerName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { font-size: 28px; color: #2563eb; margin-bottom: 4px; }
            .header p { color: #666; font-size: 14px; }
            .section { margin-bottom: 32px; }
            .section-title { font-size: 16px; font-weight: 600; color: #2563eb; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
            .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .metric-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
            .metric-value { font-size: 24px; font-weight: 700; color: #1e293b; }
            .metric-trend { font-size: 12px; margin-top: 4px; }
            .trend-up { color: #16a34a; }
            .trend-down { color: #dc2626; }
            .blurb-item { background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0; }
            .blurb-critical { border-left-color: #dc2626; }
            .blurb-action { border-left-color: #f59e0b; }
            .blurb-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .blurb-date { font-size: 12px; color: #64748b; }
            .blurb-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
            .tag-critical { background: #fef2f2; color: #dc2626; }
            .tag-action { background: #fffbeb; color: #d97706; }
            .tag-fyi { background: #f1f5f9; color: #64748b; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; }
            td { font-size: 14px; }
            .inventory-summary { display: flex; gap: 24px; }
            .inventory-item { text-align: center; }
            .inventory-value { font-size: 32px; font-weight: 700; }
            .inventory-label { font-size: 12px; color: #64748b; }
            .inventory-booked .inventory-value { color: #dc2626; }
            .inventory-available .inventory-value { color: #16a34a; }
            .inventory-pitched .inventory-value { color: #f59e0b; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Call Prep Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Call Prep Summary</span>
            <Button onClick={handlePrint} className="gap-2" disabled={!activePartnerId}>
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {!partnerId && (
          <div className="mb-4">
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
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
        )}

        {activePartnerId ? (
          <div ref={printRef}>
            {/* Header */}
            <div className="header">
              <h1>{activePartnerName}</h1>
              <p>Call Prep Summary • Generated {format(new Date(), 'MMMM d, yyyy')}</p>
            </div>

            {/* Section 1: The Pulse - Latest Metrics */}
            <div className="section">
              <div className="section-title">📊 The Pulse - Latest Metrics</div>
              {latestInsight ? (
                <div className="metrics-grid">
                  {[
                    { label: 'Revenue', value: latestInsight.revenue, prev: previousInsight?.revenue, format: 'currency' },
                    { label: 'CAC', value: latestInsight.cac, prev: previousInsight?.cac, format: 'currency' },
                    { label: 'ROAS', value: latestInsight.roas, prev: previousInsight?.roas, format: 'number' },
                    { label: 'Spend', value: latestInsight.spend, prev: previousInsight?.spend, format: 'currency' },
                    { label: 'Conversions', value: latestInsight.conversions, prev: previousInsight?.conversions, format: 'number' },
                    { label: 'Inventory %', value: latestInsight.inventory_percent, prev: previousInsight?.inventory_percent, format: 'percent' },
                  ].map((metric) => {
                    const trend = getMetricTrend(metric.value, metric.prev);
                    return (
                      <div key={metric.label} className="metric-card">
                        <div className="metric-label">{metric.label}</div>
                        <div className="metric-value">
                          {metric.format === 'currency' ? formatCurrency(metric.value) : 
                           metric.format === 'percent' ? formatPercent(metric.value) : 
                           metric.value.toLocaleString()}
                        </div>
                        {trend && (
                          <div className={`metric-trend ${trend.isUp ? 'trend-up' : trend.isDown ? 'trend-down' : ''}`}>
                            {trend.isUp ? '↑' : trend.isDown ? '↓' : '—'} {Math.abs(trend.diff).toFixed(1)}% vs last week
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No metrics data available</p>
              )}
            </div>

            {/* Section 2: Intelligence Feed */}
            <div className="section">
              <div className="section-title">🧠 Intelligence Feed - Recent Blurbs</div>
              {recentBlurbs.length > 0 ? (
                <div>
                  {recentBlurbs.map((insight) => (
                    <div 
                      key={insight.id} 
                      className={`blurb-item ${insight.priority_tag === 'critical' ? 'blurb-critical' : insight.priority_tag === 'action_required' ? 'blurb-action' : ''}`}
                    >
                      <div className="blurb-header">
                        <span className="blurb-date">Week of {format(parseISO(insight.week_start), 'MMM d, yyyy')}</span>
                        <span className={`blurb-tag ${insight.priority_tag === 'critical' ? 'tag-critical' : insight.priority_tag === 'action_required' ? 'tag-action' : 'tag-fyi'}`}>
                          {insight.priority_tag === 'critical' ? '⚠️ Critical' : insight.priority_tag === 'action_required' ? '🔔 Action Required' : 'ℹ️ FYI'}
                        </span>
                      </div>
                      {insight.weekly_blurb ? (
                        <div dangerouslySetInnerHTML={{ __html: insight.weekly_blurb }} />
                      ) : (
                        <p className="text-muted-foreground text-sm">No blurb provided</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No intelligence updates available</p>
              )}
            </div>

            {/* Section 3: Stakeholder List */}
            <div className="section">
              <div className="section-title">👥 Stakeholder List</div>
              {stakeholders.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakeholders.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.role || '—'}</td>
                        <td>{s.email}</td>
                        <td>{s.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No stakeholders found</p>
              )}
            </div>

            {/* Section 4: Inventory Status */}
            <div className="section">
              <div className="section-title">📦 Inventory Status</div>
              <div className="inventory-summary">
                <div className="inventory-item inventory-booked">
                  <div className="inventory-value">{inventoryStatus?.booked || 0}</div>
                  <div className="inventory-label">Booked Units</div>
                </div>
                <div className="inventory-item inventory-pitched">
                  <div className="inventory-value">{inventoryStatus?.pitched || 0}</div>
                  <div className="inventory-label">Pitched Units</div>
                </div>
                <div className="inventory-item inventory-available">
                  <div className="inventory-value">{inventoryStatus?.available || 0}</div>
                  <div className="inventory-label">Available Units</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a brand to generate a call prep summary</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
