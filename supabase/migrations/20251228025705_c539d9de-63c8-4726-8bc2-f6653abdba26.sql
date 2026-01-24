-- Create pipeline stage enum
CREATE TYPE public.pipeline_stage AS ENUM (
  'prospecting',
  'initial_pitch',
  'negotiation',
  'contract_sent',
  'closed_won',
  'closed_lost'
);

-- Create prospects table for business development pipeline
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  industry TEXT,
  estimated_deal_value NUMERIC,
  stage pipeline_stage NOT NULL DEFAULT 'prospecting',
  notes TEXT,
  source TEXT, -- How we found them (referral, cold outreach, inbound, etc.)
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  stage_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prospects
CREATE POLICY "Admins can view all prospects"
ON public.prospects
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all prospects"
ON public.prospects
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update stage_updated_at when stage changes
CREATE OR REPLACE FUNCTION public.update_prospect_stage_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_prospect_stage_timestamp
BEFORE UPDATE ON public.prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_prospect_stage_timestamp();