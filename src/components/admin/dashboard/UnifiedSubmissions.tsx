import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import {
  FolderOpen,
  Link as LinkIcon,
  MessageSquare,
  Mail,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { key: 'native', label: 'Native' },
  { key: 'paid_social_search', label: 'Paid Social/Search' },
  { key: 'media', label: 'Media' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'content_marketing', label: 'Content Marketing' },
] as const;

interface PartnerWithAssets {
  id: string;
  company_name: string;
  target_launch_date: string | null;
  primary_contact_email: string | null;
  campaign_status: {
    stage: string;
  } | null;
  creative_assets: Array<{
    id: string;
    channel: string;
    affiliate_link: string | null;
    file_urls: string[] | null;
  }>;
}

export default function UnifiedSubmissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingLaunchDate, setEditingLaunchDate] = useState<string | null>(null);

  const { data: partnersByChannel, isLoading, error } = useQuery({
    queryKey: ['unified-submissions'],
    queryFn: async () => {
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select(`
          id,
          company_name,
          target_launch_date,
          primary_contact_email,
          campaign_status (
            stage
          ),
          creative_assets (
            id,
            channel,
            affiliate_link,
            file_urls
          )
        `)
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;

      // Group partners by channel based on their creative assets
      const grouped = new Map<string, PartnerWithAssets[]>();

      CHANNELS.forEach(({ key }) => {
        grouped.set(key, []);
      });

      partners?.forEach((partner: any) => {
        // Group partners by the channels they have assets in
        if (partner.creative_assets && partner.creative_assets.length > 0) {
          const channelsWithAssets = new Set<string>();
          partner.creative_assets.forEach((asset: any) => {
            channelsWithAssets.add(asset.channel);
          });

          // Add partner to each channel they have assets in
          channelsWithAssets.forEach((channel) => {
            const channelList = grouped.get(channel);
            if (channelList && !channelList.find((p) => p.id === partner.id)) {
              channelList.push(partner);
            }
          });
        }
        // Note: Partners with no assets are not shown in any channel
        // This can be changed if you want to show "pending" partners in all channels
      });

      return grouped;
    },
  });

  const updateLaunchDateMutation = useMutation({
    mutationFn: async ({ partnerId, date }: { partnerId: string; date: Date | undefined }) => {
      const { error } = await supabase
        .from('partners')
        .update({ target_launch_date: date ? date.toISOString().split('T')[0] : null })
        .eq('id', partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['channel-stats'] });
      setEditingLaunchDate(null);
      toast({
        title: 'Launch date updated',
        description: 'The expected launch date has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating launch date',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (stage: string | null | undefined) => {
    if (!stage) return <Badge variant="outline">Pending</Badge>;

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      asset_collection: { label: 'Asset Collection', variant: 'outline' },
      internal_review: { label: 'Internal Review', variant: 'secondary' },
      live: { label: 'Live', variant: 'default' },
      concluded: { label: 'Concluded', variant: 'outline' },
    };

    const config = statusConfig[stage] || { label: stage, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getChannelAssets = (partner: PartnerWithAssets, channel: string) => {
    return partner.creative_assets?.filter((asset) => asset.channel === channel) || [];
  };

  const getAffiliateLink = (partner: PartnerWithAssets, channel: string) => {
    const assets = getChannelAssets(partner, channel);
    return assets[0]?.affiliate_link || null;
  };

  const getFolderUrl = (partner: PartnerWithAssets, channel: string) => {
    // In a real implementation, this would be a folder URL from storage
    // For now, we'll construct a placeholder or use the partner ID
    const assets = getChannelAssets(partner, channel);
    if (assets.length > 0 && assets[0].file_urls && assets[0].file_urls.length > 0) {
      // Return the first file URL's directory (in a real app, this would be a folder URL)
      return assets[0].file_urls[0]?.split('/').slice(0, -1).join('/') || null;
    }
    return null;
  };

  const handleSlackClick = (email: string | null) => {
    if (!email) {
      toast({
        title: 'No email available',
        description: 'Contact email is not available for this partner.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Open Slack with email (this is a placeholder - actual implementation depends on your Slack setup)
      const slackWindow = window.open(`slack://user?email=${encodeURIComponent(email)}`, '_blank');
      if (!slackWindow || slackWindow.closed || typeof slackWindow.closed === 'undefined') {
        // Fallback if Slack app is not installed
        toast({
          title: 'Slack not available',
          description: 'Please open Slack manually and search for this contact.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Opening Slack',
          description: `Opening conversation with ${email}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error opening Slack',
        description: 'Unable to open Slack. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEmailClick = (email: string | null) => {
    if (!email) {
      toast({
        title: 'No email available',
        description: 'Contact email is not available for this partner.',
        variant: 'destructive',
      });
      return;
    }

    try {
      window.location.href = `mailto:${email}`;
    } catch (error) {
      toast({
        title: 'Error opening email',
        description: 'Unable to open email client. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading submissions. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Unified Submissions</h2>
        <p className="text-sm text-muted-foreground">View and manage all partner submissions by channel</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {CHANNELS.map(({ key, label }) => {
            const partners = partnersByChannel?.get(key) || [];

            return (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold">{label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {partners.length} {partners.length === 1 ? 'campaign' : 'campaigns'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {partners.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No campaigns for {label} channel
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partner Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Launch Date</TableHead>
                          <TableHead>Links</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partners.map((partner) => {
                          const launchDate = partner.target_launch_date
                            ? new Date(partner.target_launch_date)
                            : null;
                          const isEditing = editingLaunchDate === partner.id;
                          const affiliateLink = getAffiliateLink(partner, key);
                          const folderUrl = getFolderUrl(partner, key);

                          return (
                            <TableRow key={partner.id}>
                              <TableCell className="font-medium">
                                {partner.company_name}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(partner.campaign_status?.stage)}
                              </TableCell>
                              <TableCell>
                                <Popover
                                  open={isEditing}
                                  onOpenChange={(open) => {
                                    setEditingLaunchDate(open ? partner.id : null);
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className={cn(
                                        "justify-start text-left font-normal",
                                        !launchDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {launchDate ? (
                                        format(launchDate, 'PPP')
                                      ) : (
                                        <span>Set launch date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={launchDate || undefined}
                                      onSelect={(date) => {
                                        if (date) {
                                          updateLaunchDateMutation.mutate({
                                            partnerId: partner.id,
                                            date,
                                          });
                                        }
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {folderUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        try {
                                          const newWindow = window.open(folderUrl, '_blank');
                                          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                                            toast({
                                              title: 'Unable to open link',
                                              description: 'Please check your popup blocker settings.',
                                              variant: 'destructive',
                                            });
                                          }
                                        } catch (error) {
                                          toast({
                                            title: 'Error opening folder',
                                            description: 'Unable to open asset folder.',
                                            variant: 'destructive',
                                          });
                                        }
                                      }}
                                      title="View Assets"
                                    >
                                      <FolderOpen className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {affiliateLink && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        try {
                                          const newWindow = window.open(affiliateLink, '_blank');
                                          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                                            toast({
                                              title: 'Unable to open link',
                                              description: 'Please check your popup blocker settings.',
                                              variant: 'destructive',
                                            });
                                          }
                                        } catch (error) {
                                          toast({
                                            title: 'Error opening link',
                                            description: 'Unable to open affiliate link.',
                                            variant: 'destructive',
                                          });
                                        }
                                      }}
                                      title="Open Affiliate Link"
                                    >
                                      <LinkIcon className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSlackClick(partner.primary_contact_email)}
                                    disabled={!partner.primary_contact_email}
                                    title="Open Slack"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEmailClick(partner.primary_contact_email)}
                                    disabled={!partner.primary_contact_email}
                                    title="Send Email"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
