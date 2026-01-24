import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search,
  Users,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { LeadCaptureDialog } from '@/components/admin/pipeline/LeadCaptureDialog';

type PipelineStage = 'prospecting' | 'initial_pitch' | 'negotiation' | 'contract_sent' | 'closed_won' | 'closed_lost';

interface Prospect {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  industry: string | null;
  estimated_deal_value: number | null;
  stage: PipelineStage;
  notes: string | null;
  source: string | null;
  assigned_to: string | null;
  created_by: string;
  stage_updated_at: string;
  created_at: string;
  updated_at: string;
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

export function AnalystBriefingDesk() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);

  // Fetch prospects (leads)
  const { data: prospects = [], isLoading: isLoadingProspects } = useQuery({
    queryKey: ['prospects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Prospect[];
    },
  });

  // Fetch stakeholders (contacts)
  const { data: stakeholders = [], isLoading: isLoadingStakeholders } = useQuery({
    queryKey: ['stakeholders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, partners(company_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Stakeholder[];
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: {
      company_name: string;
      contact_name: string;
      contact_email: string;
      contact_phone?: string;
      website?: string;
      industry?: string;
      estimated_deal_value?: number;
      notes?: string;
      source?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase.from('prospects').insert({
        ...data,
        contact_phone: data.contact_phone || null,
        website: data.website || null,
        industry: data.industry || null,
        estimated_deal_value: data.estimated_deal_value || null,
        notes: data.notes || null,
        source: data.source || null,
        stage: 'prospecting',
        assigned_to: user.id,
        created_by: user.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      setIsLeadDialogOpen(false);
      toast({ title: 'Lead created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create lead', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const activeLeads = prospects.filter(p => !['closed_won', 'closed_lost'].includes(p.stage));
    const totalLeads = prospects.length;
    const contactsCount = stakeholders.length;
    const pipelineValue = activeLeads.reduce((sum, p) => sum + (p.estimated_deal_value || 0), 0);

    return {
      totalLeads,
      activeLeads: activeLeads.length,
      contacts: contactsCount,
      pipelineValue,
    };
  }, [prospects, stakeholders]);

  // Filter prospects
  const filteredProspects = useMemo(() => {
    let filtered = prospects;

    // Filter by stage
    if (stageFilter !== 'all') {
      filtered = filtered.filter(p => p.stage === stageFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.company_name.toLowerCase().includes(query) ||
        p.contact_name.toLowerCase().includes(query) ||
        p.contact_email.toLowerCase().includes(query) ||
        p.source?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [prospects, stageFilter, searchQuery]);

  // Filter stakeholders
  const filteredStakeholders = useMemo(() => {
    if (!searchQuery) return stakeholders;
    
    const query = searchQuery.toLowerCase();
    return stakeholders.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.role?.toLowerCase().includes(query) ||
      s.partners?.company_name.toLowerCase().includes(query)
    );
  }, [stakeholders, searchQuery]);

  // Calculate pitch status data (using prospects stage_updated_at as last pitch date)
  const pitchStatusData = useMemo(() => {
    return prospects.map(prospect => {
      const lastPitchDate = prospect.stage_updated_at;
      const followUpDate = lastPitchDate ? new Date(lastPitchDate) : null;
      if (followUpDate) {
        followUpDate.setDate(followUpDate.getDate() + 7); // 7 days follow-up
      }
      
      // Calculate pitch count based on stage (simplified - each stage change is a pitch)
      const pitchCount = prospect.stage === 'prospecting' ? 0 : 
                        prospect.stage === 'initial_pitch' ? 1 :
                        prospect.stage === 'negotiation' ? 2 :
                        prospect.stage === 'contract_sent' ? 3 : 4;

      return {
        ...prospect,
        lastPitchDate,
        followUpDate,
        pitchCount,
      };
    });
  }, [prospects]);

  const getStageBadge = (stage: PipelineStage) => {
    const stageConfig: Record<PipelineStage, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      prospecting: { label: 'Prospecting', variant: 'outline' },
      initial_pitch: { label: 'Initial Pitch', variant: 'secondary' },
      negotiation: { label: 'Negotiation', variant: 'default' },
      contract_sent: { label: 'Contract Sent', variant: 'default' },
      closed_won: { label: 'Won', variant: 'default' },
      closed_lost: { label: 'Lost', variant: 'destructive' },
    };
    const config = stageConfig[stage] || { label: stage, variant: 'outline' };
    return <Badge variant={config.variant} className="rounded-none">{config.label}</Badge>;
  };

  const getPitchStatusBadge = (prospect: Prospect) => {
    if (prospect.stage === 'closed_won' || prospect.stage === 'closed_lost') {
      return <Badge variant={prospect.stage === 'closed_won' ? 'default' : 'destructive'} className="rounded-none">Closed</Badge>;
    }
    if (prospect.stage === 'initial_pitch' || prospect.stage === 'negotiation' || prospect.stage === 'contract_sent') {
      return <Badge variant="default" className="rounded-none bg-[#1ABC9C]">Pitched</Badge>;
    }
    return <Badge variant="outline" className="rounded-none">Follow-up</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-scientific">Analyst Briefing Desk</h2>
          <p className="text-sm text-muted-foreground">CRM for managing Leads, Contacts, and Pitch Status</p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1ABC9C]" />
              <span className="text-2xl font-bold">{stats.totalLeads}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1ABC9C]" />
              <span className="text-2xl font-bold">{stats.activeLeads}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1ABC9C]" />
              <span className="text-2xl font-bold">{stats.contacts}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#1ABC9C]" />
              <span className="text-2xl font-bold">${stats.pipelineValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-none border border-border bg-muted">
          <TabsTrigger value="leads" className="rounded-none">Leads</TabsTrigger>
          <TabsTrigger value="contacts" className="rounded-none">Contacts</TabsTrigger>
          <TabsTrigger value="pitch-status" className="rounded-none">Pitch Status</TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card className="rounded-none border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leads</CardTitle>
                <Button 
                  onClick={() => setIsLeadDialogOpen(true)}
                  className="rounded-none bg-[#1ABC9C] hover:bg-[#1ABC9C]/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lead
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-none bg-surface"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="stage-filter">Filter by stage</Label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger id="stage-filter" className="rounded-none bg-surface">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="prospecting">Prospecting</SelectItem>
                      <SelectItem value="initial_pitch">Initial Pitch</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="contract_sent">Contract Sent</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Leads Table */}
              <div className="border border-border rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Deal Value</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingProspects ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredProspects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProspects.map((prospect) => (
                        <TableRow key={prospect.id}>
                          <TableCell className="font-medium">{prospect.company_name}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{prospect.contact_name}</div>
                              <div className="text-sm text-muted-foreground">{prospect.contact_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {prospect.estimated_deal_value ? `$${prospect.estimated_deal_value.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>{getStageBadge(prospect.stage)}</TableCell>
                          <TableCell>{prospect.source || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(parseISO(prospect.updated_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card className="rounded-none border border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contacts</CardTitle>
                <div className="flex-1 max-w-md ml-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-none bg-surface"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStakeholders ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredStakeholders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No contacts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStakeholders.map((stakeholder) => (
                        <TableRow key={stakeholder.id}>
                          <TableCell className="font-medium">
                            {stakeholder.partners?.company_name || '-'}
                          </TableCell>
                          <TableCell>{stakeholder.role || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {stakeholder.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {stakeholder.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {stakeholder.phone}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pitch Status Tab */}
        <TabsContent value="pitch-status" className="space-y-4">
          <Card className="rounded-none border border-border">
            <CardHeader>
              <CardTitle>Pitch Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Pitch Date</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Pitch Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingProspects ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : pitchStatusData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No pitch data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      pitchStatusData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.company_name}</TableCell>
                          <TableCell>{getPitchStatusBadge(item)}</TableCell>
                          <TableCell>
                            {item.lastPitchDate ? format(parseISO(item.lastPitchDate), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {item.followUpDate ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className={item.followUpDate < new Date() ? 'text-destructive' : ''}>
                                  {format(item.followUpDate, 'MMM d, yyyy')}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-none">{item.pitchCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Capture Dialog */}
      <LeadCaptureDialog
        open={isLeadDialogOpen}
        onOpenChange={setIsLeadDialogOpen}
        onSubmit={(data) => createLeadMutation.mutate(data)}
        isLoading={createLeadMutation.isPending}
      />
    </div>
  );
}
