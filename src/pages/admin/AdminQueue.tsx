import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Mail, 
  Flag, 
  Link2, 
  Clock, 
  Building2,
  AlertTriangle,
  GripVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { STAGE_LABELS, STAGE_ORDER, PRIORITY_COLORS, type CampaignStage } from '@/types/campaign';
import { formatDistanceToNow } from 'date-fns';

interface QueueCard {
  id: string;
  partnerId: string;
  partnerName: string;
  stage: CampaignStage;
  priority: 'high' | 'medium' | 'low';
  stageEnteredAt: Date;
  affiliateLink: string | null;
  slackChannel: string | null;
  contactEmail: string | null;
}

export default function AdminQueue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<QueueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('campaign_status')
        .select(`
          id,
          partner_id,
          stage,
          priority,
          updated_at,
          partners (
            id,
            company_name,
            primary_contact_email
          )
        `);

      if (statusError) throw statusError;

      // Fetch affiliate links from creative_assets
      const { data: assetsData } = await supabase
        .from('creative_assets')
        .select('partner_id, affiliate_link')
        .not('affiliate_link', 'is', null);

      const affiliateLinkMap = new Map<string, string>();
      assetsData?.forEach(asset => {
        if (asset.affiliate_link) {
          affiliateLinkMap.set(asset.partner_id, asset.affiliate_link);
        }
      });

      const cards: QueueCard[] = (statusData || []).map((item: any) => ({
        id: item.id,
        partnerId: item.partner_id,
        partnerName: item.partners?.company_name || 'Unknown Partner',
        stage: item.stage as CampaignStage,
        priority: item.priority,
        stageEnteredAt: new Date(item.updated_at),
        affiliateLink: affiliateLinkMap.get(item.partner_id) || null,
        slackChannel: null, // Would be fetched from a slack integration
        contactEmail: item.partners?.primary_contact_email || null,
      }));

      setCampaigns(cards);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error loading queue',
        description: 'Failed to fetch campaign data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedCampaigns = useMemo(() => {
    const groups: Record<CampaignStage, QueueCard[]> = {
      new_submission: [],
      creative_review: [],
      partner_review: [],
      ready_for_launch: [],
      live: [],
    };

    campaigns.forEach(campaign => {
      if (groups[campaign.stage]) {
        groups[campaign.stage].push(campaign);
      }
    });

    return groups;
  }, [campaigns]);

  const handleSlackClick = (card: QueueCard) => {
    // Deep link to Slack channel or user
    const slackUrl = card.slackChannel 
      ? `slack://channel?team=T00000000&id=${card.slackChannel}`
      : 'slack://open';
    window.open(slackUrl, '_blank');
  };

  const handleEmailClick = (card: QueueCard) => {
    if (!card.contactEmail) return;
    const subject = encodeURIComponent(`Follow-up: ${card.partnerName} Campaign`);
    const body = encodeURIComponent(`Hi,\n\nFollowing up on the ${card.partnerName} campaign submission.\n\nBest regards`);
    window.location.href = `mailto:${card.contactEmail}?subject=${subject}&body=${body}`;
  };

  const handleFlagToggle = (id: string) => {
    setFlaggedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        toast({ title: 'Priority flag removed' });
      } else {
        newSet.add(id);
        toast({ title: 'Marked as high priority', variant: 'destructive' });
      }
      return newSet;
    });
  };

  const handleCopyAffiliateLink = async (link: string | null) => {
    if (!link) {
      toast({ title: 'No affiliate link available', variant: 'destructive' });
      return;
    }
    await navigator.clipboard.writeText(link);
    toast({ title: 'Affiliate link copied!' });
  };

  const handleCardClick = (card: QueueCard) => {
    navigate(`/admin/submission/${card.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Queue</h1>
          <p className="text-muted-foreground">Status at a Glance • {campaigns.length} active campaigns</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Auto-refreshes every 30s
        </Badge>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4 min-h-[calc(100vh-200px)]">
        {STAGE_ORDER.map((stage) => (
          <div key={stage} className="flex flex-col">
            {/* Column Header */}
            <div className="bg-card border border-border rounded-t-lg p-3 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">
                  {STAGE_LABELS[stage]}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {groupedCampaigns[stage].length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <ScrollArea className="flex-1 bg-muted/30 border-x border-b border-border rounded-b-lg p-2">
              <div className="space-y-2">
                {groupedCampaigns[stage].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No campaigns
                  </div>
                ) : (
                  groupedCampaigns[stage].map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${
                          flaggedIds.has(card.id) 
                            ? 'border-l-destructive bg-destructive/5' 
                            : PRIORITY_COLORS[card.priority].border
                        }`}
                        onClick={() => handleCardClick(card)}
                      >
                        <CardContent className="p-3 space-y-3">
                          {/* Partner Name */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {card.partnerName}
                                </p>
                              </div>
                            </div>
                            {flaggedIds.has(card.id) && (
                              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                            )}
                          </div>

                          {/* Time in Stage */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatDistanceToNow(card.stageEnteredAt, { addSuffix: false })} in stage</span>
                          </div>

                          {/* Priority Badge */}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${PRIORITY_COLORS[card.priority].bg} ${PRIORITY_COLORS[card.priority].text}`}
                          >
                            {card.priority.toUpperCase()}
                          </Badge>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 pt-2 border-t border-border">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSlackClick(card);
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open in Slack</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmailClick(card);
                                  }}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send Email</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-7 w-7 ${
                                    flaggedIds.has(card.id) 
                                      ? 'text-destructive hover:text-destructive/80' 
                                      : 'text-muted-foreground hover:text-destructive'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFlagToggle(card.id);
                                  }}
                                >
                                  <Flag className={`w-4 h-4 ${flaggedIds.has(card.id) ? 'fill-current' : ''}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {flaggedIds.has(card.id) ? 'Remove Flag' : 'Flag as Urgent'}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAffiliateLink(card.affiliateLink);
                                  }}
                                >
                                  <Link2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy Affiliate Link</TooltipContent>
                            </Tooltip>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}