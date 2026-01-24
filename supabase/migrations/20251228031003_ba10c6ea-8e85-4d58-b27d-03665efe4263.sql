-- Create placement status enum
CREATE TYPE public.placement_status AS ENUM (
  'available',
  'pitched',
  'booked',
  'upcoming'
);

-- Create content placements table
CREATE TABLE public.content_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  placement_type TEXT NOT NULL, -- e.g., 'Newsletter Header', 'Homepage Banner', 'Custom Content Article'
  property TEXT NOT NULL DEFAULT 'Healthline', -- Media property
  description TEXT,
  dimensions TEXT, -- e.g., '728x90', '300x250'
  rate NUMERIC(10,2), -- Cost per placement
  rate_type TEXT DEFAULT 'flat', -- 'flat', 'cpm', 'cpc'
  status placement_status NOT NULL DEFAULT 'available',
  scheduled_date DATE,
  end_date DATE,
  deal_id UUID REFERENCES public.campaign_deals(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_placements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all placements" ON public.content_placements FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage placements" ON public.content_placements FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_content_placements_updated_at 
BEFORE UPDATE ON public.content_placements 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-update status when deal is linked
CREATE OR REPLACE FUNCTION public.update_placement_status_on_deal_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- When a deal is linked, set status to 'booked'
  IF NEW.deal_id IS NOT NULL AND OLD.deal_id IS NULL THEN
    NEW.status = 'booked';
  END IF;
  -- When a deal is unlinked, set status back to 'available'
  IF NEW.deal_id IS NULL AND OLD.deal_id IS NOT NULL THEN
    NEW.status = 'available';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_update_placement_status
BEFORE UPDATE ON public.content_placements
FOR EACH ROW
EXECUTE FUNCTION public.update_placement_status_on_deal_link();