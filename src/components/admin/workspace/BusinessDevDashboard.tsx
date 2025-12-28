import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import { PipelineKanban } from '@/components/admin/pipeline/PipelineKanban';
import { LeadCaptureDialog } from '@/components/admin/pipeline/LeadCaptureDialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

export function BusinessDevDashboard() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: prospects = [], isLoading } = useQuery({
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

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: PipelineStage }) => {
      const { error } = await supabase
        .from('prospects')
        .update({ stage })
        .eq('id', id);
      
      if (error) throw error;

      // If moved to closed_won, trigger the invite email
      if (stage === 'closed_won') {
        const prospect = prospects.find(p => p.id === id);
        if (prospect) {
          try {
            const response = await supabase.functions.invoke('send-partner-invite', {
              body: {
                contactName: prospect.contact_name,
                contactEmail: prospect.contact_email,
                companyName: prospect.company_name,
              },
            });
            
            if (response.error) {
              console.error('Failed to send invite:', response.error);
              toast.error('Deal closed but failed to send partner invite');
            } else {
              toast.success('Partner invite sent successfully!');
            }
          } catch (err) {
            console.error('Error sending invite:', err);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
    },
    onError: (error) => {
      toast.error('Failed to update prospect stage');
      console.error(error);
    },
  });

  const createProspectMutation = useMutation({
    mutationFn: async (data: Omit<Prospect, 'id' | 'created_at' | 'updated_at' | 'stage_updated_at'>) => {
      const { error } = await supabase
        .from('prospects')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      setIsLeadDialogOpen(false);
      toast.success('Lead added to pipeline!');
    },
    onError: (error) => {
      toast.error('Failed to create prospect');
      console.error(error);
    },
  });

  const handleStageChange = (id: string, stage: PipelineStage) => {
    updateStageMutation.mutate({ id, stage });
  };

  const handleCreateLead = (data: {
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
    if (!user) return;
    
    createProspectMutation.mutate({
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
  };

  // Calculate stats
  const stats = {
    totalProspects: prospects.length,
    activeDeals: prospects.filter(p => !['closed_won', 'closed_lost'].includes(p.stage)).length,
    closedWon: prospects.filter(p => p.stage === 'closed_won').length,
    totalPipelineValue: prospects
      .filter(p => !['closed_won', 'closed_lost'].includes(p.stage))
      .reduce((sum, p) => sum + (p.estimated_deal_value || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalProspects}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.activeDeals}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closed Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-2xl font-bold">{stats.closedWon}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">
                ${stats.totalPipelineValue.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sales Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Drag prospects between stages to update their status
          </p>
        </div>
        <Button onClick={() => setIsLeadDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Kanban Pipeline */}
      <PipelineKanban
        prospects={prospects}
        onStageChange={handleStageChange}
        isLoading={isLoading}
      />

      {/* Lead Capture Dialog */}
      <LeadCaptureDialog
        open={isLeadDialogOpen}
        onOpenChange={setIsLeadDialogOpen}
        onSubmit={handleCreateLead}
        isLoading={createProspectMutation.isPending}
      />
    </div>
  );
}
