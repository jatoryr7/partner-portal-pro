-- Create enum for contract status
CREATE TYPE contract_status AS ENUM ('draft', 'signed', 'expired');

-- Create campaign_deals table as the central CRM hub
CREATE TABLE public.campaign_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  deal_name TEXT NOT NULL,
  deal_value NUMERIC(12, 2),
  contract_status contract_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  assigned_internal_manager UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add deal_id to creative_assets to link assets to deals
ALTER TABLE public.creative_assets 
ADD COLUMN deal_id UUID REFERENCES public.campaign_deals(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.campaign_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_deals
CREATE POLICY "Admins can view all deals"
ON public.campaign_deals
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all deals"
ON public.campaign_deals
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view their own deals"
ON public.campaign_deals
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM partners
  WHERE partners.id = campaign_deals.partner_id
  AND partners.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_campaign_deals_updated_at
BEFORE UPDATE ON public.campaign_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_campaign_deals_partner_id ON public.campaign_deals(partner_id);
CREATE INDEX idx_creative_assets_deal_id ON public.creative_assets(deal_id);