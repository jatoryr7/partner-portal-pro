-- Create operational_insights table for analyst briefings
CREATE TABLE public.operational_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  
  -- Core metrics
  revenue NUMERIC DEFAULT 0,
  cac NUMERIC DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  inventory_percent NUMERIC DEFAULT 0,
  
  -- Content
  weekly_blurb TEXT,
  priority_tag TEXT NOT NULL DEFAULT 'fyi' CHECK (priority_tag IN ('critical', 'fyi', 'action_required')),
  
  -- External resources (stored as JSONB array)
  external_resources JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operational_insights ENABLE ROW LEVEL SECURITY;

-- Admins can manage all insights
CREATE POLICY "Admins can manage insights"
  ON public.operational_insights
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all insights
CREATE POLICY "Admins can view all insights"
  ON public.operational_insights
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Partners can view insights for their own brands
CREATE POLICY "Partners can view their own insights"
  ON public.operational_insights
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = operational_insights.partner_id
    AND partners.user_id = auth.uid()
  ));

-- Create updated_at trigger
CREATE TRIGGER update_operational_insights_updated_at
  BEFORE UPDATE ON public.operational_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying
CREATE INDEX idx_operational_insights_partner_week 
  ON public.operational_insights(partner_id, week_start DESC);

CREATE INDEX idx_operational_insights_priority 
  ON public.operational_insights(priority_tag, created_at DESC);