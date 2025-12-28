import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  Search, 
  Mail, 
  Phone, 
  MessageSquare,
  FolderOpen,
  Users,
  Briefcase,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, differenceInDays, differenceInHours, isWithinInterval, addDays } from 'date-fns';
import { toast } from 'sonner';

interface Stakeholder {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
}

interface Partner {
  id: string;
  company_name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  secondary_contact_name: string | null;
  secondary_contact_email: string | null;
  submission_date: string;
  assigned_manager_id: string | null;
  campaign_status: {
    stage: string;
    priority: string;
    next_meeting_date: string | null;
  } | null;
  stakeholders: Stakeholder[];
  asset_count: number;
  total_deal_value: number;
}

interface TeamMember {
  id: string;
  email: string | null;
  full_name: string | null;
}

export default function BrandDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [showMyBrandsOnly, setShowMyBrandsOnly] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch team members (admins)
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name');
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners-directory-full'],
    queryFn: async () => {
      // Fetch partners with joined stakeholders and campaign_status
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select(`
          *,
          campaign_status (
            stage,
            priority,
            next_meeting_date
          ),
          stakeholders (
            id,
            name,
            role,
            email,
            phone
          )
        `);

      if (partnersError) throw partnersError;

      // Fetch asset counts for all partners
      const { data: assetCounts, error: assetError } = await supabase
        .from('creative_assets')
        .select('partner_id');

      if (assetError) throw assetError;

      // Fetch deal values for all partners
      const { data: dealValues, error: dealError } = await supabase
        .from('campaign_deals')
        .select('partner_id, deal_value');

      if (dealError) throw dealError;

      // Aggregate asset counts by partner_id
      const countsByPartner = (assetCounts || []).reduce((acc, asset) => {
        acc[asset.partner_id] = (acc[asset.partner_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Aggregate deal values by partner_id
      const dealValuesByPartner = (dealValues || []).reduce((acc, deal) => {
        acc[deal.partner_id] = (acc[deal.partner_id] || 0) + (deal.deal_value || 0);
        return acc;
      }, {} as Record<string, number>);

      // Merge asset counts and deal values into partner data
      const enrichedPartners = (partnersData || []).map(partner => ({
        ...partner,
        stakeholders: partner.stakeholders || [],
        asset_count: countsByPartner[partner.id] || 0,
        total_deal_value: dealValuesByPartner[partner.id] || 0,
      })) as Partner[];

      // Sort by total deal value (highest first)
      return enrichedPartners.sort((a, b) => b.total_deal_value - a.total_deal_value);
    },
  });

  // Mutation to update assigned manager
  const updateManagerMutation = useMutation({
    mutationFn: async ({ partnerId, managerId }: { partnerId: string; managerId: string | null }) => {
      const { error } = await supabase
        .from('partners')
        .update({ assigned_manager_id: managerId })
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-directory-full'] });
      toast.success('Manager assigned successfully');
    },
    onError: () => {
      toast.error('Failed to assign manager');
    },
  });

  const filteredPartners = partners?.filter((partner) => {
    // First apply "My Brands Only" filter
    if (showMyBrandsOnly && partner.assigned_manager_id !== user?.id) {
      return false;
    }

    // Then apply search filter
    return partner.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.stakeholders?.some(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  });

  const toggleBrand = (brandId: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const getStageColor = (stage: string | undefined) => {
    switch (stage) {
      case 'intake': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'review': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleSlackClick = (email: string) => {
    window.open(`slack://user?team=&id=`, '_blank');
  };

  const handleViewCreativeHistory = (partnerId: string) => {
    navigate(`/admin/native?brand=${partnerId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMeetingCountdown = (meetingDate: string | null) => {
    if (!meetingDate) return null;

    const meeting = new Date(meetingDate);
    const now = new Date();
    const in7Days = addDays(now, 7);

    // Check if meeting is within next 7 days
    if (!isWithinInterval(meeting, { start: now, end: in7Days })) {
      return null;
    }

    const days = differenceInDays(meeting, now);
    const hours = differenceInHours(meeting, now) % 24;

    if (days === 0) {
      return hours <= 0 ? 'Today' : `In ${hours}h`;
    }
    
    return `In ${days}d ${hours}h`;
  };

  const totalRevenue = partners?.reduce((acc, p) => acc + p.total_deal_value, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brand Directory</h1>
        <p className="text-muted-foreground">
          Searchable directory of all partner brands and their creative contacts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners?.filter(p => p.campaign_status?.stage === 'in_progress').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Brands</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners?.filter(p => p.assigned_manager_id === user?.id).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands, contacts, or emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="my-brands"
            checked={showMyBrandsOnly}
            onCheckedChange={setShowMyBrandsOnly}
          />
          <Label htmlFor="my-brands" className="cursor-pointer">My Brands Only</Label>
        </div>
      </div>

      {/* Brand Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPartners?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No brands found</p>
            <p className="text-sm">Try adjusting your search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPartners?.map((partner) => {
            const meetingCountdown = getMeetingCountdown(partner.campaign_status?.next_meeting_date || null);
            const assignedManager = teamMembers?.find(m => m.id === partner.assigned_manager_id);

            return (
              <Card key={partner.id} className="overflow-hidden relative">
                {/* Revenue Badge */}
                {partner.total_deal_value > 0 && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-semibold text-sm px-3 py-1">
                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                      {formatCurrency(partner.total_deal_value)}
                    </Badge>
                  </div>
                )}

                <Collapsible 
                  open={expandedBrands.has(partner.id)} 
                  onOpenChange={() => toggleBrand(partner.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pr-32">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Brand Logo/Avatar */}
                          <Avatar className="h-12 w-12 border-2 border-border">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(partner.company_name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-semibold">{partner.company_name}</h3>
                              <Badge variant="outline" className={getStageColor(partner.campaign_status?.stage)}>
                                {partner.campaign_status?.stage?.replace('_', ' ') || 'No Campaign'}
                              </Badge>
                              {partner.campaign_status?.priority && (
                                <Badge variant="outline" className={getPriorityColor(partner.campaign_status.priority)}>
                                  {partner.campaign_status.priority} priority
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {partner.stakeholders?.length || 0} contacts
                              </span>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <FolderOpen className="h-3.5 w-3.5" />
                                {partner.asset_count} assets
                              </Badge>
                              {assignedManager && (
                                <span className="flex items-center gap-1">
                                  <UserCheck className="h-3.5 w-3.5" />
                                  {assignedManager.full_name || assignedManager.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Next Meeting Tile */}
                          {meetingCountdown && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <Calendar className="h-4 w-4 text-amber-600" />
                              <div className="text-sm">
                                <p className="text-amber-600 font-medium">{meetingCountdown}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(partner.campaign_status!.next_meeting_date!), 'MMM d')}
                                </p>
                              </div>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCreativeHistory(partner.id);
                            }}
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            View Creative History
                          </Button>
                          {expandedBrands.has(partner.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="pt-4 space-y-6">
                      {/* Owner Assignment */}
                      <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Assigned Manager:
                        </Label>
                        <Select
                          value={partner.assigned_manager_id || 'unassigned'}
                          onValueChange={(value) => {
                            updateManagerMutation.mutate({
                              partnerId: partner.id,
                              managerId: value === 'unassigned' ? null : value,
                            });
                          }}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {teamMembers?.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.full_name || member.email || 'Unknown'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Next Meeting Section (visible on mobile in expanded view) */}
                      {meetingCountdown && (
                        <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg w-fit">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          <div className="text-sm">
                            <p className="text-amber-600 font-medium">{meetingCountdown}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(partner.campaign_status!.next_meeting_date!), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-4">
                          Creative Contacts
                        </h4>
                        
                        {partner.stakeholders?.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {partner.stakeholders.map((stakeholder) => (
                              <div 
                                key={stakeholder.id}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                                    {getInitials(stakeholder.name)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium truncate">{stakeholder.name}</p>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={() => handleEmailClick(stakeholder.email)}
                                          >
                                            <Mail className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Send Email</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={() => handleSlackClick(stakeholder.email)}
                                          >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Message on Slack</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                  
                                  {stakeholder.role && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      {stakeholder.role}
                                    </Badge>
                                  )}
                                  
                                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    <p className="flex items-center gap-2 truncate">
                                      <Mail className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{stakeholder.email}</span>
                                    </p>
                                    {stakeholder.phone && (
                                      <p className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 shrink-0" />
                                        {stakeholder.phone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                            <Users className="h-10 w-10 mb-3 opacity-40" />
                            <p className="font-medium">No creative contacts yet</p>
                            <p className="text-sm mt-1">This brand hasn't added any stakeholder contacts</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
