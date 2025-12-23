import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Building2,
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
  paidSocialSearch: 'Paid Social',
  media: 'Media',
  newsletter: 'Newsletter',
  contentMarketing: 'Content',
};

const CHANNEL_COLORS: Record<ChannelKey, string> = {
  native: 'bg-primary/10 text-primary border-primary/20',
  paidSocialSearch: 'bg-accent/10 text-accent border-accent/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  newsletter: 'bg-success/10 text-success border-success/20',
  contentMarketing: 'bg-destructive/10 text-destructive border-destructive/20',
};

// Map database snake_case to frontend camelCase
const DB_CHANNEL_MAP: Record<string, ChannelKey> = {
  native: 'native',
  paid_social_search: 'paidSocialSearch',
  media: 'media',
  newsletter: 'newsletter',
  content_marketing: 'contentMarketing',
};

export default function StakeholderDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

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
        creative_assets (
          channel,
          is_complete,
          copy_text,
          file_urls,
          affiliate_link
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
      partner.creative_assets?.forEach((asset: { channel: string; is_complete: boolean; copy_text: string | null; file_urls: string[] | null; affiliate_link: string | null }) => {
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
      };
    });

    setSubmissions(formattedSubmissions);
    setLoading(false);
  };

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

  const handleEmailBrand = (brandName: string) => {
    toast({
      title: 'Email Drafted',
      description: `Opening email composer for ${brandName}`,
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
        <h1 className="text-2xl font-bold text-foreground">Stakeholder Dashboard</h1>
        <p className="text-muted-foreground">
          Manage all brand submissions, track timelines, and coordinate team efforts
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{submissions.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incomplete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              <span className="text-2xl font-bold">
                {submissions.filter((s) => s.status === 'incomplete').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-success">
              ${submissions.reduce((acc, s) => acc + s.revenue, 0).toLocaleString()}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Package Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-primary">
              ${submissions.length ? Math.round(submissions.reduce((acc, s) => acc + s.revenue, 0) / submissions.length).toLocaleString() : 0}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Brand Name</TableHead>
                  <TableHead className="font-semibold">Channels</TableHead>
                  <TableHead className="font-semibold">
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
                  <TableHead className="font-semibold">Assigned To</TableHead>
                  <TableHead className="font-semibold">Expected Launch</TableHead>
                  <TableHead className="font-semibold">Actual Launch</TableHead>
                  <TableHead className="font-semibold">Campaign End</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSubmissions.map((submission) => (
                  <TableRow key={submission.id} className="hover:bg-muted/30">
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

                    {/* Channels Tags */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {submission.channels.map((channel) => (
                          <Badge
                            key={channel}
                            variant="outline"
                            className={cn('text-xs', CHANNEL_COLORS[channel])}
                          >
                            {CHANNEL_LABELS[channel]}
                          </Badge>
                        ))}
                        {submission.channels.length === 0 && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
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

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => handleNotifySlack(submission.brandName)}
                        >
                          <Slack className="w-3.5 h-3.5 mr-1" />
                          Slack
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleEmailBrand(submission.brandName)}
                        >
                          <Mail className="w-3.5 h-3.5 mr-1" />
                          Email
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {sortedSubmissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No submissions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
