import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, isPast } from 'date-fns';
import {
  Scale,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActivityFeed } from '../ActivityFeed';

type ContractStatus = 'draft' | 'signed' | 'expired';

interface Deal {
  id: string;
  partner_id: string;
  deal_name: string;
  deal_value: number | null;
  contract_status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  partners: {
    id: string;
    company_name: string;
  };
}

export function LegalDashboard() {
  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals-legal-view'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_deals')
        .select(`
          *,
          partners (
            id,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'signed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate stats
  const totalValue = deals?.reduce((acc, d) => acc + (d.deal_value || 0), 0) || 0;
  const signedValue =
    deals
      ?.filter((d) => d.contract_status === 'signed')
      .reduce((acc, d) => acc + (d.deal_value || 0), 0) || 0;
  const draftDeals = deals?.filter((d) => d.contract_status === 'draft') || [];
  const expiringDeals =
    deals?.filter((d) => {
      if (!d.end_date || d.contract_status === 'expired') return false;
      const daysUntilExpiry = differenceInDays(new Date(d.end_date), new Date());
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }) || [];

  const conversionRate =
    deals && deals.length > 0
      ? Math.round((deals.filter((d) => d.contract_status === 'signed').length / deals.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Legal / Finance View</h2>
        <p className="text-muted-foreground">Contract tracking and payment milestones</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {deals?.length || 0} total deals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Signed Value</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(signedValue)}</div>
            <Progress value={totalValue > 0 ? (signedValue / totalValue) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Signature</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftDeals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(draftDeals.reduce((acc, d) => acc + (d.deal_value || 0), 0))} value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expiringDeals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Overview</CardTitle>
          <CardDescription>All deals with contract status and payment tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : deals?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No deals found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals?.map((deal) => {
                  const isExpiringSoon =
                    deal.end_date &&
                    deal.contract_status !== 'expired' &&
                    differenceInDays(new Date(deal.end_date), new Date()) <= 30 &&
                    differenceInDays(new Date(deal.end_date), new Date()) > 0;

                  const isExpired = deal.end_date && isPast(new Date(deal.end_date));

                  return (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(deal.partners?.company_name || 'NA')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{deal.partners?.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{deal.deal_name}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(deal.deal_value)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(deal.contract_status)}>
                          {deal.contract_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deal.start_date && deal.end_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {format(new Date(deal.start_date), 'MMM d')} -{' '}
                              {format(new Date(deal.end_date), 'MMM d, yyyy')}
                            </span>
                            {isExpiringSoon && (
                              <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/20">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expiring
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge variant="outline" className="ml-2 text-destructive border-destructive/20">
                                Expired
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActivityFeed partnerId={deal.partner_id} compact />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Conversion</CardTitle>
          <CardDescription>Deal progression from draft to signed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conversion Rate</span>
                <span className="text-2xl font-bold">{conversionRate}%</span>
              </div>
              <Progress value={conversionRate} className="h-3" />
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{draftDeals.length}</p>
                <p className="text-muted-foreground">Draft</p>
              </div>
              <TrendingUp className="h-6 w-6 text-muted-foreground self-center" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {deals?.filter((d) => d.contract_status === 'signed').length || 0}
                </p>
                <p className="text-muted-foreground">Signed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
