import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInHours, isBefore, addHours } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Flag,
  CalendarIcon,
  Slack,
  Mail,
  AlertTriangle,
  Link2,
  FolderOpen,
  Megaphone,
  Share2,
  Film,
  Newspaper,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ChannelKey } from '@/types/partner';

interface Submission {
  id: string;
  brandName: string;
  channels: ChannelKey[];
  revenue: number;
  assignedTo: string;
  expectedLaunch: Date | null;
  actualLaunch: Date | null;
  campaignEndDate: Date | null;
  status: 'complete' | 'incomplete' | 'in_review';
  missingElements: string[];
  affiliateLink: string | null;
  assetFolderUrl: string | null;
  primaryContactEmail: string | null;
}

const TEAM_MEMBERS = [
  'Unassigned',
  'Sarah Johnson',
  'Michael Chen',
  'Emily Rodriguez',
  'David Kim',
  'Lisa Thompson',
];

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  native: 'Native',
  paidSocialSearch: 'Paid Social/Search',
  media: 'Media',
  newsletter: 'Newsletter',
  contentMarketing: 'Content Marketing',
};

const CHANNEL_COLORS: Record<ChannelKey, string> = {
  native: 'bg-primary/10 text-primary border-primary/20',
  paidSocialSearch: 'bg-accent/10 text-accent border-accent/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  newsletter: 'bg-success/10 text-success border-success/20',
  contentMarketing: 'bg-destructive/10 text-destructive border-destructive/20',
};

const CHANNEL_ICONS: Record<ChannelKey, React.ElementType> = {
  native: Megaphone,
  paidSocialSearch: Share2,
  media: Film,
  newsletter: Newspaper,
  contentMarketing: FileText,
};

// Map database snake_case to frontend camelCase
const DB_CHANNEL_MAP: Record<string, ChannelKey> = {
  native: 'native',
  paid_social_search: 'paidSocialSearch',
  media: 'media',
  newsletter: 'newsletter',
  content_marketing: 'contentMarketing',
};

const ALL_CHANNELS: ChannelKey[] = ['native', 'paidSocialSearch', 'media', 'newsletter', 'contentMarketing'];

interface ChannelStats {
  total: number;
  complete: number;
  inProgress: number;
  percentage: number;
}

export default function StakeholderDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [openChannels, setOpenChannels] = useState<string[]>(ALL_CHANNELS);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data: partners, error } = await supabase
      .from('partners')
      .select(`
        id,
        company_name,
        target_launch_date,
        primary_contact_email,
        creative_assets (
          channel,
          is_complete,
          copy_text,
          file_urls,
          affiliate_link,
          asset_url
        ),
        campaign_status (
          stage,
          campaign_conclusion_date
        )
      `);

    if (error) {
      console.error('Error fetching submissions:', error);
      setLoading(false);
      return;
    }

    const formattedSubmissions: Submission[] = (partners || []).map((partner) => {
      const dbChannels = [...new Set(partner.creative_assets?.map((a: { channel: string }) => a.channel) || [])] as string[];
      const channels = dbChannels.map(ch => DB_CHANNEL_MAP[ch]).filter(Boolean) as ChannelKey[];
      
      // Calculate missing elements
      const missingElements: string[] = [];
      let affiliateLink: string | null = null;
      let assetFolderUrl: string | null = null;

      partner.creative_assets?.forEach((asset: { 
        channel: string; 
        is_complete: boolean; 
        copy_text: string | null; 
        file_urls: string[] | null; 
        affiliate_link: string | null;
        asset_url: string | null;
      }) => {
        // Capture affiliate link and asset folder
        if (asset.affiliate_link && !affiliateLink) affiliateLink = asset.affiliate_link;
        if (asset.asset_url && !assetFolderUrl) assetFolderUrl = asset.asset_url;

        if (!asset.is_complete) {
          const mappedChannel = DB_CHANNEL_MAP[asset.channel];
          const channelLabel = mappedChannel ? CHANNEL_LABELS[mappedChannel] : asset.channel;
          if (!asset.copy_text) missingElements.push(`${channelLabel}: Copy text`);
          if (!asset.file_urls?.length) missingElements.push(`${channelLabel}: Files`);
          if (asset.channel === 'paid_social_search' && !asset.affiliate_link) {
            missingElements.push(`${channelLabel}: Affiliate link`);
          }
        }
      });

      const allComplete = partner.creative_assets?.every((a: { is_complete: boolean }) => a.is_complete) ?? true;
      const hasAssets = partner.creative_assets?.length > 0;

      return {
        id: partner.id,
        brandName: partner.company_name,
        channels,
        revenue: Math.floor(Math.random() * 50000) + 5000, // Mock revenue data
        assignedTo: 'Unassigned',
        expectedLaunch: partner.target_launch_date ? new Date(partner.target_launch_date) : null,
        actualLaunch: null,
        campaignEndDate: partner.campaign_status?.[0]?.campaign_conclusion_date 
          ? new Date(partner.campaign_status[0].campaign_conclusion_date) 
          : null,
        status: !hasAssets || missingElements.length > 0 ? 'incomplete' : allComplete ? 'complete' : 'in_review',
        missingElements,
        affiliateLink,
        assetFolderUrl,
        primaryContactEmail: partner.primary_contact_email,
      };
    });

    setSubmissions(formattedSubmissions);
    setLoading(false);
  };

  // Calculate channel statistics
  const channelStats = useMemo(() => {
    const stats: Record<ChannelKey, ChannelStats> = {} as Record<ChannelKey, ChannelStats>;
    
    ALL_CHANNELS.forEach(channel => {
      const channelSubmissions = submissions.filter(s => s.channels.includes(channel));
      const complete = channelSubmissions.filter(s => s.status === 'complete').length;
      const total = channelSubmissions.length;
      
      stats[channel] = {
        total,
        complete,
        inProgress: total - complete,
        percentage: total > 0 ? Math.round((complete / total) * 100) : 0,
      };
    });
    
    return stats;
  }, [submissions]);

  // Calculate at-risk campaigns (within 72 hours, still missing assets)
  const atRiskCampaigns = useMemo(() => {
    const now = new Date();
    const cutoff = addHours(now, 72);
    
    return submissions.filter(s => {
      if (!s.expectedLaunch || s.status === 'complete') return false;
      return isBefore(s.expectedLaunch, cutoff) && s.missingElements.length > 0;
    });
  }, [submissions]);

  // Group submissions by channel
  const submissionsByChannel = useMemo(() => {
    const grouped: Record<ChannelKey, Submission[]> = {} as Record<ChannelKey, Submission[]>;
    
    ALL_CHANNELS.forEach(channel => {
      grouped[channel] = submissions.filter(s => s.channels.includes(channel));
    });
    
    return grouped;
  }, [submissions]);

  const sortedSubmissions = useMemo(() => {
    if (!sortDirection) return submissions;
    
    return [...submissions].sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.revenue - b.revenue;
      }
      return b.revenue - a.revenue;
    });
  }, [submissions, sortDirection]);

  const handleSortToggle = () => {
    if (sortDirection === null) setSortDirection('desc');
    else if (sortDirection === 'desc') setSortDirection('asc');
    else setSortDirection(null);
  };

  const updateSubmission = (id: string, updates: Partial<Submission>) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
    );
  };

  const handleNotifySlack = (brandName: string) => {
    toast({
      title: 'Slack Notification Sent',
      description: `Team notified about ${brandName}`,
    });
  };

  const handleEmailBrand = (submission: Submission) => {
    const email = submission.primaryContactEmail || '';
    const subject = encodeURIComponent(`Follow-up: ${submission.brandName} Campaign Assets`);
    const missingList = submission.missingElements.length > 0 
      ? submission.missingElements.join('\n- ') 
      : 'No specific items flagged';
    const body = encodeURIComponent(
      `Hi,\n\nThis is a follow-up regarding the ${submission.brandName} campaign.\n\nMissing Assets:\n- ${missingList}\n\nPlease provide these assets at your earliest convenience.\n\nBest regards`
    );
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    
    toast({
      title: 'Email Composer Opened',
      description: `Drafting email to ${submission.brandName}`,
    });
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  const DatePickerCell = ({
    date,
    onChange,
    placeholder,
  }: {
    date: Date | null;
    onChange: (date: Date | undefined) => void;
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'w-[120px] justify-start text-left font-normal h-8 text-xs',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-1 h-3 w-3" />
          {date ? format(date, 'MMM d, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={onChange}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  const SubmissionRow = ({ submission }: { submission: Submission }) => {
    const hasWarning = submission.missingElements.length > 0;
    
    return (
      <TableRow 
        className={cn(
          'hover:bg-muted/30 transition-colors',
          hasWarning && 'bg-destructive/5 hover:bg-destructive/10'
        )}
      >
        {/* Status with Flag */}
        <TableCell>
          {submission.status === 'incomplete' ? (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-destructive fill-destructive" />
                  <span className="text-xs text-destructive font-medium">
                    Incomplete
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                className="bg-popover border border-border p-3 max-w-xs"
              >
                <p className="font-semibold text-foreground mb-2">Missing Elements:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {submission.missingElements.length > 0 ? (
                    submission.missingElements.map((el, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-destructive">•</span>
                        {el}
                      </li>
                    ))
                  ) : (
                    <li>No assets submitted yet</li>
                  )}
                </ul>
              </TooltipContent>
            </Tooltip>
          ) : submission.status === 'complete' ? (
            <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
              Complete
            </Badge>
          ) : (
            <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
              In Review
            </Badge>
          )}
        </TableCell>

        {/* Brand Name */}
        <TableCell className="font-medium text-foreground">
          {submission.brandName}
        </TableCell>

        {/* Resources (Quick Links) */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!submission.affiliateLink}
                  onClick={() => submission.affiliateLink && window.open(submission.affiliateLink, '_blank')}
                >
                  <Link2 className={cn(
                    "h-4 w-4",
                    submission.affiliateLink ? "text-primary" : "text-muted-foreground"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {submission.affiliateLink ? 'Open Affiliate Link' : 'No affiliate link'}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!submission.assetFolderUrl}
                  onClick={() => submission.assetFolderUrl && window.open(submission.assetFolderUrl, '_blank')}
                >
                  <FolderOpen className={cn(
                    "h-4 w-4",
                    submission.assetFolderUrl ? "text-accent" : "text-muted-foreground"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {submission.assetFolderUrl ? 'Open Asset Folder' : 'No asset folder'}
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>

        {/* Revenue (Editable) */}
        <TableCell>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">$</span>
            <Input
              type="number"
              value={submission.revenue}
              onChange={(e) =>
                updateSubmission(submission.id, {
                  revenue: parseInt(e.target.value) || 0,
                })
              }
              className="w-24 h-8 text-sm font-medium"
            />
          </div>
        </TableCell>

        {/* Assigned To */}
        <TableCell>
          <Select
            value={submission.assignedTo}
            onValueChange={(value) =>
              updateSubmission(submission.id, { assignedTo: value })
            }
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {TEAM_MEMBERS.map((member) => (
                <SelectItem key={member} value={member}>
                  {member}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>

        {/* Expected Launch */}
        <TableCell>
          <DatePickerCell
            date={submission.expectedLaunch}
            onChange={(date) =>
              updateSubmission(submission.id, { expectedLaunch: date || null })
            }
            placeholder="Set date"
          />
        </TableCell>

        {/* Actual Launch */}
        <TableCell>
          <DatePickerCell
            date={submission.actualLaunch}
            onChange={(date) =>
              updateSubmission(submission.id, { actualLaunch: date || null })
            }
            placeholder="Set date"
          />
        </TableCell>

        {/* Campaign End */}
        <TableCell>
          <DatePickerCell
            date={submission.campaignEndDate}
            onChange={(date) =>
              updateSubmission(submission.id, { campaignEndDate: date || null })
            }
            placeholder="Set date"
          />
        </TableCell>

        {/* Follow Up Actions */}
        <TableCell>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="h-8 w-8 bg-[#4A154B] hover:bg-[#4A154B]/90 text-white"
                  onClick={() => handleNotifySlack(submission.brandName)}
                >
                  <Slack className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send Slack Notification</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-[#0078D4] text-[#0078D4] hover:bg-[#0078D4]/10"
                  onClick={() => handleEmailBrand(submission)}
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open Email Draft</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
        <p className="text-muted-foreground">
          High-level tracking and granular control over creative submissions
        </p>
      </div>

      {/* Status Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_CHANNELS.map((channel) => {
          const Icon = CHANNEL_ICONS[channel];
          const stats = channelStats[channel];
          
          return (
            <Card key={channel} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "p-1.5 rounded-md",
                    CHANNEL_COLORS[channel].split(' ')[0]
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {CHANNEL_LABELS[channel]}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold">{stats.total}</span>
                  <span className="text-xs text-muted-foreground">campaigns</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-success">{stats.complete} complete</span>
                    <span className="text-muted-foreground">{stats.percentage}%</span>
                  </div>
                  <Progress 
                    value={stats.percentage} 
                    className="h-1.5 bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* At Risk Card */}
        <Card className={cn(
          "relative overflow-hidden border-2",
          atRiskCampaigns.length > 0 
            ? "border-destructive bg-destructive/5" 
            : "border-transparent"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs font-medium text-destructive">
                At Risk
              </span>
            </div>
            
            <div className="flex items-baseline gap-1 mb-2">
              <span className={cn(
                "text-2xl font-bold",
                atRiskCampaigns.length > 0 ? "text-destructive" : "text-foreground"
              )}>
                {atRiskCampaigns.length}
              </span>
              <span className="text-xs text-muted-foreground">campaigns</span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Launch in &lt;72hrs with missing assets
            </p>
            
            {atRiskCampaigns.length > 0 && (
              <div className="mt-2 space-y-1">
                {atRiskCampaigns.slice(0, 2).map(c => (
                  <div key={c.id} className="text-xs text-destructive truncate">
                    • {c.brandName}
                  </div>
                ))}
                {atRiskCampaigns.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{atRiskCampaigns.length - 2} more
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grouped Submissions by Channel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Submissions by Channel</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setOpenChannels(ALL_CHANNELS)}
              >
                Expand All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setOpenChannels([])}
              >
                Collapse All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion 
            type="multiple" 
            value={openChannels}
            onValueChange={setOpenChannels}
            className="space-y-2"
          >
            {ALL_CHANNELS.map((channel) => {
              const Icon = CHANNEL_ICONS[channel];
              const channelSubmissions = submissionsByChannel[channel];
              const stats = channelStats[channel];
              
              return (
                <AccordionItem 
                  key={channel} 
                  value={channel}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-md",
                        CHANNEL_COLORS[channel].split(' ')[0]
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-foreground">
                          {CHANNEL_LABELS[channel]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stats.total} campaigns • {stats.complete} complete • {stats.inProgress} in progress
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mr-4">
                        <div className="w-24">
                          <Progress 
                            value={stats.percentage} 
                            className="h-2"
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">
                          {stats.percentage}%
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {channelSubmissions.length > 0 ? (
                      <div className="overflow-x-auto -mx-4">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="font-semibold w-28">Status</TableHead>
                              <TableHead className="font-semibold">Brand</TableHead>
                              <TableHead className="font-semibold w-24">Resources</TableHead>
                              <TableHead className="font-semibold w-32">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSortToggle}
                                  className="h-auto p-0 font-semibold hover:bg-transparent"
                                >
                                  Revenue
                                  {getSortIcon()}
                                </Button>
                              </TableHead>
                              <TableHead className="font-semibold w-36">Assigned To</TableHead>
                              <TableHead className="font-semibold w-32">Expected</TableHead>
                              <TableHead className="font-semibold w-32">Actual</TableHead>
                              <TableHead className="font-semibold w-32">End Date</TableHead>
                              <TableHead className="font-semibold w-24">Follow Up</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {channelSubmissions
                              .sort((a, b) => {
                                if (!sortDirection) return 0;
                                if (sortDirection === 'asc') return a.revenue - b.revenue;
                                return b.revenue - a.revenue;
                              })
                              .map((submission) => (
                                <SubmissionRow key={submission.id} submission={submission} />
                              ))
                            }
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No submissions yet</p>
                        <p className="text-sm">Campaigns for {CHANNEL_LABELS[channel]} will appear here</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
