import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Link as LinkIcon,
  Folder,
  MessageSquare,
  Mail,
  CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Image,
  FileText,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============ CHANNEL CONFIGURATION ============
const CHANNELS = [
  { key: 'native', label: 'Native', color: 'hsl(25, 95%, 53%)' }, // Orange
  { key: 'paid_social_search', label: 'Paid Social', color: 'hsl(217, 91%, 60%)' }, // Blue
  { key: 'media', label: 'Media', color: 'hsl(271, 91%, 65%)' }, // Purple
  { key: 'newsletter', label: 'Newsletter', color: 'hsl(142, 71%, 45%)' }, // Green
  { key: 'content_marketing', label: 'Content Marketing', color: 'hsl(199, 89%, 48%)' }, // Cyan
] as const;

type ChannelKey = typeof CHANNELS[number]['key'];

// ============ TYPES ============
interface DealWithAssets {
  id: string;
  deal_name: string;
  partner_id: string;
  company_name: string;
  primary_contact_email: string | null;
  target_launch_date: string | null;
  contract_status: string;
  affiliate_link: string | null;
  drive_folder_url: string | null; // Mocked - not in DB
  channel: ChannelKey;
  assets: {
    id: string;
    is_complete: boolean;
    asset_url: string | null;
    copy_text: string | null;
    file_urls: string[] | null;
  }[];
  totalExpectedAssets: number;
  receivedAssets: number;
}

interface ChannelStats {
  key: ChannelKey;
  label: string;
  color: string;
  totalCampaigns: number;
  receivedAssets: number;
  expectedAssets: number;
  progressPercent: number;
  hasAtRisk: boolean;
}

// ============ DATA FETCHING ============
async function fetchDealsWithAssets(): Promise<DealWithAssets[]> {
  // Fetch deals with partner info
  const { data: deals, error: dealsError } = await supabase
    .from('campaign_deals')
    .select(`
      id,
      deal_name,
      partner_id,
      contract_status,
      partners (
        company_name,
        primary_contact_email,
        target_launch_date
      )
    `)
    .in('contract_status', ['signed', 'draft']);

  if (dealsError) throw dealsError;

  // Fetch all creative assets
  const { data: assets, error: assetsError } = await supabase
    .from('creative_assets')
    .select('*');

  if (assetsError) throw assetsError;

  // Group assets by deal_id and partner_id
  const assetsByDeal = new Map<string, typeof assets>();
  const assetsByPartner = new Map<string, typeof assets>();

  assets?.forEach((asset) => {
    if (asset.deal_id) {
      const existing = assetsByDeal.get(asset.deal_id) || [];
      assetsByDeal.set(asset.deal_id, [...existing, asset]);
    }
    const partnerAssets = assetsByPartner.get(asset.partner_id) || [];
    assetsByPartner.set(asset.partner_id, [...partnerAssets, asset]);
  });

  // Transform into DealWithAssets
  const result: DealWithAssets[] = [];

  deals?.forEach((deal) => {
    const partner = deal.partners as any;
    const dealAssets = assetsByDeal.get(deal.id) || assetsByPartner.get(deal.partner_id) || [];

    // Group by channel
    const channelGroups = new Map<ChannelKey, typeof dealAssets>();
    dealAssets.forEach((asset) => {
      const channel = asset.channel as ChannelKey;
      if (CHANNELS.find((c) => c.key === channel)) {
        const existing = channelGroups.get(channel) || [];
        channelGroups.set(channel, [...existing, asset]);
      }
    });

    // Create a record per channel
    channelGroups.forEach((channelAssets, channel) => {
      const receivedAssets = channelAssets.filter(
        (a) => a.is_complete || a.asset_url || a.copy_text || (a.file_urls && a.file_urls.length > 0)
      ).length;
      const totalExpectedAssets = Math.max(channelAssets.length, 3); // Assume minimum 3 expected per channel

      result.push({
        id: `${deal.id}-${channel}`,
        deal_name: deal.deal_name,
        partner_id: deal.partner_id,
        company_name: partner?.company_name || 'Unknown',
        primary_contact_email: partner?.primary_contact_email || null,
        target_launch_date: partner?.target_launch_date || null,
        contract_status: deal.contract_status,
        affiliate_link: channelAssets[0]?.affiliate_link || null,
        drive_folder_url: null, // Mocked
        channel,
        assets: channelAssets.map((a) => ({
          id: a.id,
          is_complete: a.is_complete,
          asset_url: a.asset_url,
          copy_text: a.copy_text,
          file_urls: a.file_urls,
        })),
        totalExpectedAssets,
        receivedAssets,
      });
    });

    // If no assets, still show deal in "native" by default
    if (channelGroups.size === 0) {
      result.push({
        id: deal.id,
        deal_name: deal.deal_name,
        partner_id: deal.partner_id,
        company_name: partner?.company_name || 'Unknown',
        primary_contact_email: partner?.primary_contact_email || null,
        target_launch_date: partner?.target_launch_date || null,
        contract_status: deal.contract_status,
        affiliate_link: null,
        drive_folder_url: null,
        channel: 'native',
        assets: [],
        totalExpectedAssets: 3,
        receivedAssets: 0,
      });
    }
  });

  return result;
}

// ============ HELPER FUNCTIONS ============
function isAtRisk(deal: DealWithAssets): boolean {
  if (!deal.target_launch_date) return false;
  const daysUntilLaunch = differenceInDays(parseISO(deal.target_launch_date), new Date());
  return daysUntilLaunch <= 3 && deal.receivedAssets < deal.totalExpectedAssets;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
    case 'signed':
      return 'default';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
}

// ============ COMPONENTS ============

// Tracking Bar KPI Card
function ChannelKPICard({ stats }: { stats: ChannelStats }) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg',
        stats.hasAtRisk && 'border-destructive border-2'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{stats.label}</CardTitle>
          {stats.hasAtRisk && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{stats.totalCampaigns}</span>
          <Badge
            variant="outline"
            style={{ borderColor: stats.color, color: stats.color }}
          >
            Active
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Assets Received</span>
            <span>
              {stats.receivedAssets}/{stats.expectedAssets} ({stats.progressPercent}%)
            </span>
          </div>
          <Progress value={stats.progressPercent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// Date Picker Cell with Popover
function DatePickerCell({
  date,
  dealId,
  onDateChange,
}: {
  date: string | null;
  dealId: string;
  onDateChange: (dealId: string, newDate: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsedDate = date ? parseISO(date) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(parsedDate!, 'MMM d, yyyy') : 'Set date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={(newDate) => {
            if (newDate) {
              onDateChange(dealId, newDate);
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Deal Row Component
function DealRow({
  deal,
  onDateChange,
}: {
  deal: DealWithAssets;
  onDateChange: (dealId: string, newDate: Date) => void;
}) {
  const atRisk = isAtRisk(deal);

  const handleSlackClick = () => {
    toast({
      title: 'Opening Slack...',
      description: `Preparing message for ${deal.company_name}`,
    });
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`Urgent: Missing Assets for ${deal.company_name}`);
    const body = encodeURIComponent(
      `Hi,\n\nThis is a reminder regarding the missing creative assets for the ${deal.deal_name} campaign.\n\nPlease submit the remaining assets at your earliest convenience.\n\nBest regards`
    );
    window.open(`mailto:${deal.primary_contact_email || ''}?subject=${subject}&body=${body}`);
  };

  return (
    <TableRow className={cn(atRisk && 'bg-destructive/5 hover:bg-destructive/10')}>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{deal.company_name}</span>
          {atRisk && (
            <Badge variant="destructive" className="text-xs">
              At Risk
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{deal.deal_name}</span>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(deal.contract_status)}>
          {deal.contract_status}
        </Badge>
      </TableCell>
      <TableCell>
        <DatePickerCell
          date={deal.target_launch_date}
          dealId={deal.id}
          onDateChange={onDateChange}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {deal.affiliate_link ? (
            <a
              href={deal.affiliate_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <LinkIcon className="h-4 w-4" />
            </a>
          ) : (
            <LinkIcon className="h-4 w-4 text-muted-foreground/30" />
          )}
          {deal.drive_folder_url ? (
            <a
              href={deal.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <Folder className="h-4 w-4" />
            </a>
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground/30" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {deal.assets.length > 0 ? (
            <>
              <div className="flex items-center gap-1 text-xs">
                <Image className="h-3 w-3" />
                <span>{deal.assets.filter((a) => a.asset_url).length}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <FileText className="h-3 w-3" />
                <span>{deal.assets.filter((a) => a.copy_text).length}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Video className="h-3 w-3" />
                <span>{deal.assets.filter((a) => a.file_urls?.length).length}</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No assets</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSlackClick}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleEmailClick}
            disabled={!deal.primary_contact_email}
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============ MAIN COMPONENT ============
export default function InternalDashboard() {
  const queryClient = useQueryClient();
  const [expandedChannels, setExpandedChannels] = useState<string[]>(['native']);

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['internal-dashboard-deals'],
    queryFn: fetchDealsWithAssets,
  });

  // Update launch date mutation
  const updateDateMutation = useMutation({
    mutationFn: async ({ dealId, newDate }: { dealId: string; newDate: Date }) => {
      // Extract partner_id from the deal
      const realDealId = dealId.includes('-') ? dealId.split('-')[0] : dealId;
      const deal = deals?.find((d) => d.id.startsWith(realDealId));
      if (!deal) throw new Error('Deal not found');

      const { error } = await supabase
        .from('partners')
        .update({ target_launch_date: format(newDate, 'yyyy-MM-dd') })
        .eq('id', deal.partner_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-dashboard-deals'] });
      toast({
        title: 'Date Updated',
        description: 'Launch date has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update launch date.',
        variant: 'destructive',
      });
    },
  });

  // Calculate channel statistics
  const channelStats = useMemo<ChannelStats[]>(() => {
    if (!deals) return [];

    return CHANNELS.map((channel) => {
      const channelDeals = deals.filter((d) => d.channel === channel.key);
      const totalReceived = channelDeals.reduce((sum, d) => sum + d.receivedAssets, 0);
      const totalExpected = channelDeals.reduce((sum, d) => sum + d.totalExpectedAssets, 0);
      const hasAtRisk = channelDeals.some(isAtRisk);

      return {
        key: channel.key,
        label: channel.label,
        color: channel.color,
        totalCampaigns: channelDeals.length,
        receivedAssets: totalReceived,
        expectedAssets: totalExpected,
        progressPercent: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0,
        hasAtRisk,
      };
    });
  }, [deals]);

  // Group deals by channel
  const dealsByChannel = useMemo(() => {
    if (!deals) return new Map<ChannelKey, DealWithAssets[]>();

    const grouped = new Map<ChannelKey, DealWithAssets[]>();
    CHANNELS.forEach((c) => grouped.set(c.key, []));

    deals.forEach((deal) => {
      const existing = grouped.get(deal.channel) || [];
      grouped.set(deal.channel, [...existing, deal]);
    });

    return grouped;
  }, [deals]);

  const handleDateChange = (dealId: string, newDate: Date) => {
    updateDateMutation.mutate({ dealId, newDate });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold">Error Loading Dashboard</h2>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">
            Track creative submissions across all channels
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {deals?.length || 0} Active Campaigns
        </Badge>
      </div>

      {/* Tracking Bar - KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))
          : channelStats.map((stats) => (
              <ChannelKPICard key={stats.key} stats={stats} />
            ))}
      </div>

      {/* Grouped Submissions Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Campaign Submissions by Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={expandedChannels}
              onValueChange={setExpandedChannels}
              className="w-full"
            >
              {CHANNELS.map((channel) => {
                const channelDeals = dealsByChannel.get(channel.key) || [];
                const openTickets = channelDeals.filter((d) => d.receivedAssets < d.totalExpectedAssets).length;

                return (
                  <AccordionItem key={channel.key} value={channel.key}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: channel.color }}
                        />
                        <span className="font-medium">{channel.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {openTickets} open
                        </Badge>
                        {channelStats.find((s) => s.key === channel.key)?.hasAtRisk && (
                          <Badge variant="destructive" className="ml-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            At Risk
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {channelDeals.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-success" />
                          <p>No active campaigns in this channel</p>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Brand</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Expected Launch</TableHead>
                                <TableHead>Links</TableHead>
                                <TableHead>Assets</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {channelDeals.map((deal) => (
                                <DealRow
                                  key={deal.id}
                                  deal={deal}
                                  onDateChange={handleDateChange}
                                />
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
