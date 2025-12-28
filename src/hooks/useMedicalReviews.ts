import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MedicalReviewStatus = 
  | 'pending_bd_approval'
  | 'in_medical_review'
  | 'approved'
  | 'rejected'
  | 'requires_revision';

export interface MedicalReview {
  id: string;
  partner_id: string;
  deal_id: string | null;
  status: MedicalReviewStatus;
  bd_approved_by: string | null;
  bd_approved_at: string | null;
  bd_notes: string | null;
  estimated_revenue: number | null;
  clinical_evidence_score: number | null;
  safety_score: number | null;
  transparency_score: number | null;
  overall_grade: string | null;
  medical_reviewer_id: string | null;
  medical_reviewed_at: string | null;
  medical_notes: string | null;
  clinical_claims: string[] | null;
  safety_concerns: string[] | null;
  required_disclaimers: string[] | null;
  final_decision_by: string | null;
  final_decision_at: string | null;
  final_decision_notes: string | null;
  report_generated_at: string | null;
  created_at: string;
  updated_at: string;
  partners?: {
    id: string;
    company_name: string;
    primary_contact_name: string | null;
    primary_contact_email: string | null;
  };
  campaign_deals?: {
    id: string;
    deal_name: string;
    deal_value: number | null;
  } | null;
}

export const STATUS_LABELS: Record<MedicalReviewStatus, string> = {
  pending_bd_approval: 'Pending BD Approval',
  in_medical_review: 'In Medical Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_revision: 'Requires Revision',
};

export const STATUS_COLORS: Record<MedicalReviewStatus, string> = {
  pending_bd_approval: 'bg-amber-100 text-amber-800',
  in_medical_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  requires_revision: 'bg-orange-100 text-orange-800',
};

export function calculateGrade(scores: { clinical: number | null; safety: number | null; transparency: number | null }): string | null {
  const { clinical, safety, transparency } = scores;
  if (clinical === null || safety === null || transparency === null) return null;
  
  const average = (clinical + safety + transparency) / 3;
  
  if (average >= 9) return 'A';
  if (average >= 7) return 'B';
  if (average >= 5) return 'C';
  if (average >= 3) return 'D';
  return 'F';
}

export function useMedicalReviews(status?: MedicalReviewStatus) {
  return useQuery({
    queryKey: ['medical-reviews', status],
    queryFn: async () => {
      let query = supabase
        .from('medical_reviews')
        .select(`
          *,
          partners (
            id,
            company_name,
            primary_contact_name,
            primary_contact_email
          ),
          campaign_deals (
            id,
            deal_name,
            deal_value
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MedicalReview[];
    },
  });
}

export function useMedicalReviewStats() {
  return useQuery({
    queryKey: ['medical-review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_reviews')
        .select('status, estimated_revenue');
      
      if (error) throw error;

      const stats = {
        pending_bd: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        total_pipeline_value: 0,
      };

      data?.forEach((review) => {
        if (review.status === 'pending_bd_approval') stats.pending_bd++;
        if (review.status === 'in_medical_review') stats.in_review++;
        if (review.status === 'approved') stats.approved++;
        if (review.status === 'rejected') stats.rejected++;
        if (review.estimated_revenue) stats.total_pipeline_value += Number(review.estimated_revenue);
      });

      return stats;
    },
  });
}

export function useCreateMedicalReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { partner_id: string; deal_id?: string; estimated_revenue?: number }) => {
      const { data: review, error } = await supabase
        .from('medical_reviews')
        .insert({
          partner_id: data.partner_id,
          deal_id: data.deal_id || null,
          estimated_revenue: data.estimated_revenue || null,
          status: 'pending_bd_approval',
        })
        .select()
        .single();

      if (error) throw error;
      return review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['medical-review-stats'] });
      toast({ title: 'Review created', description: 'Brand added to submission queue.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useApproveBD() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, notes, estimated_revenue }: { id: string; notes?: string; estimated_revenue?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('medical_reviews')
        .update({
          status: 'in_medical_review',
          bd_approved_by: user?.id,
          bd_approved_at: new Date().toISOString(),
          bd_notes: notes || null,
          estimated_revenue: estimated_revenue || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['medical-review-stats'] });
      toast({ title: 'BD Approved', description: 'Brand moved to Medical Review queue.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSubmitMedicalScores() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      clinical_evidence_score,
      safety_score,
      transparency_score,
      medical_notes,
      clinical_claims,
      safety_concerns,
      required_disclaimers,
    }: {
      id: string;
      clinical_evidence_score: number;
      safety_score: number;
      transparency_score: number;
      medical_notes?: string;
      clinical_claims?: string[];
      safety_concerns?: string[];
      required_disclaimers?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const overall_grade = calculateGrade({
        clinical: clinical_evidence_score,
        safety: safety_score,
        transparency: transparency_score,
      });

      const { error } = await supabase
        .from('medical_reviews')
        .update({
          clinical_evidence_score,
          safety_score,
          transparency_score,
          overall_grade,
          medical_reviewer_id: user?.id,
          medical_reviewed_at: new Date().toISOString(),
          medical_notes: medical_notes || null,
          clinical_claims: clinical_claims || [],
          safety_concerns: safety_concerns || [],
          required_disclaimers: required_disclaimers || [],
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-reviews'] });
      toast({ title: 'Scores Saved', description: 'Medical review scores have been recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useFinalDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      decision,
      notes,
    }: {
      id: string;
      decision: 'approved' | 'rejected' | 'requires_revision';
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('medical_reviews')
        .update({
          status: decision,
          final_decision_by: user?.id,
          final_decision_at: new Date().toISOString(),
          final_decision_notes: notes || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medical-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['medical-review-stats'] });
      const action = variables.decision === 'approved' ? 'approved' : 
                     variables.decision === 'rejected' ? 'rejected' : 'sent for revision';
      toast({ title: 'Decision Recorded', description: `Brand has been ${action}.` });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMarkReportGenerated() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('medical_reviews')
        .update({ report_generated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-reviews'] });
    },
  });
}
