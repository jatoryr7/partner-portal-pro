-- Create funnel stage enum for BD workspace
CREATE TYPE public.funnel_stage AS ENUM (
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
);

-- Add funnel_stage column to campaign_deals
ALTER TABLE public.campaign_deals 
ADD COLUMN funnel_stage funnel_stage DEFAULT 'prospecting';

-- Create inventory table for property date slots
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name TEXT NOT NULL,
  date_slot DATE NOT NULL,
  status placement_status NOT NULL DEFAULT 'available',
  campaign_id UUID REFERENCES public.campaign_deals(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_name, date_slot)
);

-- Create campaign analytics table
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaign_deals(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  cac NUMERIC(12,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Admins can view all inventory slots" ON public.inventory FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage inventory slots" ON public.inventory FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for campaign_analytics
CREATE POLICY "Admins can view all analytics" ON public.campaign_analytics FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage analytics" ON public.campaign_analytics FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_analytics_updated_at BEFORE UPDATE ON public.campaign_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update inventory status when campaign is linked
CREATE OR REPLACE FUNCTION public.update_inventory_status_on_campaign_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL AND OLD.campaign_id IS NULL THEN
    NEW.status = 'booked';
  END IF;
  IF NEW.campaign_id IS NULL AND OLD.campaign_id IS NOT NULL THEN
    NEW.status = 'available';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_update_inventory_status
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_status_on_campaign_link();