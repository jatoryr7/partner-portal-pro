
-- Create medical review status enum
CREATE TYPE medical_review_status AS ENUM (
  'pending_bd_approval',
  'in_medical_review', 
  'approved',
  'rejected',
  'requires_revision'
);

-- Create medical reviews table
CREATE TABLE public.medical_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.campaign_deals(id) ON DELETE SET NULL,
  
  -- Review status workflow
  status medical_review_status NOT NULL DEFAULT 'pending_bd_approval',
  
  -- BD Approval Gate
  bd_approved_by UUID,
  bd_approved_at TIMESTAMP WITH TIME ZONE,
  bd_notes TEXT,
  estimated_revenue NUMERIC,
  
  -- Medical Review Scores (1-10)
  clinical_evidence_score INTEGER CHECK (clinical_evidence_score >= 1 AND clinical_evidence_score <= 10),
  safety_score INTEGER CHECK (safety_score >= 1 AND safety_score <= 10),
  transparency_score INTEGER CHECK (transparency_score >= 1 AND transparency_score <= 10),
  overall_grade TEXT, -- A, B, C, D, F
  
  -- Medical Review Details
  medical_reviewer_id UUID,
  medical_reviewed_at TIMESTAMP WITH TIME ZONE,
  medical_notes TEXT,
  clinical_claims TEXT[],
  safety_concerns TEXT[],
  required_disclaimers TEXT[],
  
  -- Final Decision
  final_decision_by UUID,
  final_decision_at TIMESTAMP WITH TIME ZONE,
  final_decision_notes TEXT,
  
  -- Report
  report_generated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage medical reviews"
  ON public.medical_reviews
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all medical reviews"
  ON public.medical_reviews
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_medical_reviews_updated_at
  BEFORE UPDATE ON public.medical_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_medical_reviews_status ON public.medical_reviews(status);
CREATE INDEX idx_medical_reviews_partner ON public.medical_reviews(partner_id);
