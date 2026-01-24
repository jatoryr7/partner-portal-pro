import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users, 
  ExternalLink,
  Mail,
  Phone,
  Building2,
  FileImage,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Deal {
  id: string;
  deal_name: string;
  deal_value: number | null;
  contract_status: 'draft' | 'signed' | 'expired';
  start_date: string | null;
  end_date: string | null;
  partner_id: string;
  partners?: {
    id: string;
    company_name: string;
    primary_contact_name: string | null;
    primary_contact_email: string | null;
  };
}

interface CampaignStatus {
  id: string;
  partner_id: string;
  stage: string;
  partners?: {
    id: string;
    company_name: string;
    primary_contact_name: string | null;
    primary_contact_email: string | null;
  };
}

interface Stakeholder {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  partner_id: string;
  partners?: {
    company_name: string;
  };
}

interface CreativeAsset {
  partner_id: string;
  channel: string;
  partners?: {
    id: string;
    company_name: string;
  };
}

export function PartnerManagementDashboard() {
  // Fetch deals with partner info
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['pm-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_deals')
        .select('*, partners(id, company_name, primary_contact_name, primary_contact_email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });

  // Fetch live campaigns with stakeholders
  const { data: liveCampaigns = [] } = useQuery({
    queryKey: ['pm-live-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_status')
        .select('*, partners(id, company_name, primary_contact_name, primary_contact_email)')
        .eq('stage', 'live');
      if (error) throw error;
      return data as CampaignStatus[];
    },
  });

  // Fetch stakeholders for live partners
  const livePartnerIds = liveCampaigns.map(c => c.partner_id);
  const { data: stakeholders = [] } = useQuery({
    queryKey: ['pm-stakeholders', livePartnerIds],
    queryFn: async () => {
      if (livePartnerIds.length === 0) return [];
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, partners(company_name)')
        .in('partner_id', livePartnerIds);
      if (error) throw error;
      return data as Stakeholder[];
    },
    enabled: livePartnerIds.length > 0,
  });

  // Fetch creative assets for live partners
  const { data: creativeAssets = [] } = useQuery({
    queryKey: ['pm-creative-assets', livePartnerIds],
    queryFn: async () => {
      if (livePartnerIds.length === 0) return [];
      const { data, error } = await supabase
        .from('creative_assets')
        .select('partner_id, channel, partners(id, company_name)')
        .in('partner_id', livePartnerIds);
      if (error) throw error;
      return data as CreativeAsset[];
    },
    enabled: livePartnerIds.length > 0,
  });

  // Calculate metrics
  const signedDeals = deals.filter(d => d.contract_status === 'signed');
  const pitchedDeals = deals.filter(d => d.contract_status === 'draft');
  const totalRevenue = signedDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const avgDealSize = signedDeals.length > 0 ? totalRevenue / signedDeals.length : 0;
  // CAC placeholder - would need marketing spend data
  const estimatedCAC = signedDeals.length > 0 ? 2500 : 0;

  // Group stakeholders by partner
  const stakeholdersByPartner = stakeholders.reduce((acc, s) => {
    if (!acc[s.partner_id]) acc[s.partner_id] = [];
    acc[s.partner_id].push(s);
    return acc;
  }, {} as Record<string, Stakeholder[]>);

  // Get unique partners with creative assets
  const partnersWithCreatives = [...new Set(creativeAssets.map(a => a.partner_id))];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-success/10 text-success border-success/20">Signed</Badge>;
      case 'draft':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pitched</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {signedDeals.length} signed deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Deal Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{formatCurrency(avgDealSize)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{formatCurrency(estimatedCAC)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customer acquisition cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Live Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{liveCampaigns.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Deal Overview</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                {pitchedDeals.length} Pitched
              </Badge>
              <Badge variant="outline" className="bg-success/10 text-success">
                {signedDeals.length} Signed
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Deal Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Deal Value</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : deals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No deals found
                  </TableCell>
                </TableRow>
              ) : (
                deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{deal.partners?.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{deal.deal_name}</TableCell>
                    <TableCell>{getStatusBadge(deal.contract_status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {deal.deal_value ? formatCurrency(deal.deal_value) : '-'}
                    </TableCell>
                    <TableCell>
                      {deal.start_date ? format(new Date(deal.start_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {deal.end_date ? format(new Date(deal.end_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {deal.partners?.primary_contact_email && (
                        <a 
                          href={`mailto:${deal.partners.primary_contact_email}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {deal.partners.primary_contact_name || deal.partners.primary_contact_email}
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick-Access Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Live Brand Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveCampaigns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No live campaigns currently
              </p>
            ) : (
              <div className="space-y-4">
                {liveCampaigns.map((campaign) => {
                  const partnerStakeholders = stakeholdersByPartner[campaign.partner_id] || [];
                  return (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          {campaign.partners?.company_name}
                        </h4>
                        <Badge className="bg-success/10 text-success border-success/20">
                          Live
                        </Badge>
                      </div>
                      
                      {/* Primary Contact */}
                      {campaign.partners?.primary_contact_name && (
                        <div className="flex items-center gap-3 text-sm mb-2">
                          <Badge variant="outline" className="text-xs">Primary</Badge>
                          <span>{campaign.partners.primary_contact_name}</span>
                          {campaign.partners.primary_contact_email && (
                            <a 
                              href={`mailto:${campaign.partners.primary_contact_email}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Mail className="h-3 w-3" />
                              Email
                            </a>
                          )}
                        </div>
                      )}

                      {/* Additional Stakeholders */}
                      {partnerStakeholders.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {partnerStakeholders.slice(0, 3).map((s) => (
                            <div key={s.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="w-24 truncate">{s.role || 'Stakeholder'}</span>
                              <span>{s.name}</span>
                              <div className="flex items-center gap-2 ml-auto">
                                {s.email && (
                                  <a href={`mailto:${s.email}`} className="hover:text-primary">
                                    <Mail className="h-3 w-3" />
                                  </a>
                                )}
                                {s.phone && (
                                  <a href={`tel:${s.phone}`} className="hover:text-primary">
                                    <Phone className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creative Deep Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Creative Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveCampaigns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No live campaigns currently
              </p>
            ) : (
              <div className="space-y-3">
                {liveCampaigns.map((campaign) => {
                  const partnerAssets = creativeAssets.filter(a => a.partner_id === campaign.partner_id);
                  const channels = [...new Set(partnerAssets.map(a => a.channel))];
                  
                  return (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{campaign.partners?.company_name}</h4>
                        <Badge variant="secondary">{partnerAssets.length} assets</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {channels.length > 0 ? (
                          channels.map((channel) => (
                            <Link
                              key={channel}
                              to={`/admin/${channel.replace('_', '-')}?partner=${campaign.partner_id}`}
                            >
                              <Button variant="outline" size="sm" className="gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {channel.replace('_', ' ')}
                              </Button>
                            </Link>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No assets uploaded</span>
                        )}
                        
                        <Link to={`/admin/brands?partner=${campaign.partner_id}`}>
                          <Button variant="default" size="sm" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View All
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
