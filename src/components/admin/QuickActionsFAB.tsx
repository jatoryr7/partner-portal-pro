import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Target,
  Calendar,
  FileText,
  X,
} from 'lucide-react';
import { CallPrepExport } from '@/components/admin/CallPrepExport';

type QuickAction = 'new_pitch' | 'schedule_meeting' | 'call_prep' | null;

export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<QuickAction>(null);
  const [isPitchDialogOpen, setIsPitchDialogOpen] = useState(false);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [isCallPrepOpen, setIsCallPrepOpen] = useState(false);
  
  // Pitch form state
  const [pitchPartnerId, setPitchPartnerId] = useState('');
  const [pitchTitle, setPitchTitle] = useState('');
  const [pitchNotes, setPitchNotes] = useState('');
  const [pitchValue, setPitchValue] = useState('');

  // Meeting form state
  const [meetingPartnerId, setMeetingPartnerId] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery({
    queryKey: ['quick-action-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data;
    },
  });

  // Create new pitch (deal)
  const createPitchMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('campaign_deals').insert({
        partner_id: pitchPartnerId,
        deal_name: pitchTitle,
        deal_value: parseFloat(pitchValue) || null,
        notes: pitchNotes,
        funnel_stage: 'prospecting',
        contract_status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-deals'] });
      toast.success('Pitch created successfully');
      setIsPitchDialogOpen(false);
      resetPitchForm();
    },
    onError: () => {
      toast.error('Failed to create pitch');
    },
  });

  // Schedule meeting (update campaign_status)
  const scheduleMeetingMutation = useMutation({
    mutationFn: async () => {
      // First check if campaign_status exists for this partner
      const { data: existing } = await supabase
        .from('campaign_status')
        .select('id')
        .eq('partner_id', meetingPartnerId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('campaign_status')
          .update({ next_meeting_date: meetingDate })
          .eq('partner_id', meetingPartnerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaign_status')
          .insert({ 
            partner_id: meetingPartnerId, 
            next_meeting_date: meetingDate,
            stage: 'intake',
            priority: 'medium',
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners-directory-full'] });
      toast.success('Meeting scheduled successfully');
      setIsMeetingDialogOpen(false);
      resetMeetingForm();
    },
    onError: () => {
      toast.error('Failed to schedule meeting');
    },
  });

  const resetPitchForm = () => {
    setPitchPartnerId('');
    setPitchTitle('');
    setPitchNotes('');
    setPitchValue('');
  };

  const resetMeetingForm = () => {
    setMeetingPartnerId('');
    setMeetingDate('');
    setMeetingNotes('');
  };

  const handleAction = (action: QuickAction) => {
    setIsOpen(false);
    switch (action) {
      case 'new_pitch':
        setIsPitchDialogOpen(true);
        break;
      case 'schedule_meeting':
        setIsMeetingDialogOpen(true);
        break;
      case 'call_prep':
        setIsCallPrepOpen(true);
        break;
    }
  };

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Action Menu */}
          {isOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end animate-in slide-in-from-bottom-2">
              <Button
                variant="secondary"
                className="gap-2 shadow-lg"
                onClick={() => handleAction('new_pitch')}
              >
                <Target className="h-4 w-4" />
                New Pitch
              </Button>
              <Button
                variant="secondary"
                className="gap-2 shadow-lg"
                onClick={() => handleAction('schedule_meeting')}
              >
                <Calendar className="h-4 w-4" />
                Schedule Meeting
              </Button>
              <Button
                variant="secondary"
                className="gap-2 shadow-lg"
                onClick={() => handleAction('call_prep')}
              >
                <FileText className="h-4 w-4" />
                Generate Call Prep
              </Button>
            </div>
          )}

          {/* Main FAB */}
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-xl"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* New Pitch Dialog */}
      <Dialog open={isPitchDialogOpen} onOpenChange={setIsPitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Create New Pitch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Brand</Label>
              <Select value={pitchPartnerId} onValueChange={setPitchPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pitch Title</Label>
              <Input
                value={pitchTitle}
                onChange={(e) => setPitchTitle(e.target.value)}
                placeholder="e.g., Q1 2025 Campaign"
              />
            </div>
            <div>
              <Label>Estimated Value ($)</Label>
              <Input
                type="number"
                value={pitchValue}
                onChange={(e) => setPitchValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={pitchNotes}
                onChange={(e) => setPitchNotes(e.target.value)}
                placeholder="Add any relevant notes..."
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => createPitchMutation.mutate()}
              disabled={!pitchPartnerId || !pitchTitle || createPitchMutation.isPending}
            >
              {createPitchMutation.isPending ? 'Creating...' : 'Create Pitch'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Meeting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Brand</Label>
              <Select value={meetingPartnerId} onValueChange={setMeetingPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meeting Date & Time</Label>
              <Input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Meeting agenda, topics to discuss..."
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => scheduleMeetingMutation.mutate()}
              disabled={!meetingPartnerId || !meetingDate || scheduleMeetingMutation.isPending}
            >
              {scheduleMeetingMutation.isPending ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Prep Dialog */}
      <Dialog open={isCallPrepOpen} onOpenChange={setIsCallPrepOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Call Prep Summary
            </DialogTitle>
          </DialogHeader>
          <CallPrepExportInline />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline version of CallPrepExport without the trigger button
function CallPrepExportInline() {
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  
  const { data: partners = [] } = useQuery({
    queryKey: ['call-prep-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Brand</Label>
        <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a brand to generate call prep" />
          </SelectTrigger>
          <SelectContent>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedPartnerId && (
        <div className="pt-4">
          <CallPrepExport 
            partnerId={selectedPartnerId} 
            partnerName={partners.find(p => p.id === selectedPartnerId)?.company_name} 
          />
        </div>
      )}
    </div>
  );
}
