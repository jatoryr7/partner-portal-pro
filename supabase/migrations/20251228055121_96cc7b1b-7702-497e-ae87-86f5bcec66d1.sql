-- Master Brands table for unified brand identification
CREATE TABLE public.master_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  common_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Network brand mappings (maps network-specific names to master brands)
CREATE TABLE public.network_brand_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_brand_id UUID NOT NULL REFERENCES public.master_brands(id) ON DELETE CASCADE,
  network TEXT NOT NULL, -- 'impact', 'cj', 'shareasale'
  network_brand_name TEXT NOT NULL,
  network_brand_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(network, network_brand_name)
);

-- Monthly billables for reconciliation
CREATE TABLE public.monthly_billables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_brand_id UUID NOT NULL REFERENCES public.master_brands(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  network TEXT NOT NULL,
  conversions INTEGER NOT NULL DEFAULT 0,
  gross_revenue NUMERIC NOT NULL DEFAULT 0,
  network_reported_payout NUMERIC NOT NULL DEFAULT 0,
  internal_tracked_payout NUMERIC NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  dispute_status TEXT, -- 'none', 'initiated', 'resolved'
  dispute_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(master_brand_id, billing_month, network)
);

-- API connection status tracking
CREATE TABLE public.network_api_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL UNIQUE,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.master_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_brand_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_billables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_api_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for master_brands
CREATE POLICY "Admins can manage master brands" ON public.master_brands
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all master brands" ON public.master_brands
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for network_brand_mappings
CREATE POLICY "Admins can manage network mappings" ON public.network_brand_mappings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all network mappings" ON public.network_brand_mappings
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for monthly_billables
CREATE POLICY "Admins can manage billables" ON public.monthly_billables
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all billables" ON public.monthly_billables
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for network_api_status
CREATE POLICY "Admins can manage api status" ON public.network_api_status
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all api status" ON public.network_api_status
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_master_brands_updated_at
  BEFORE UPDATE ON public.master_brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_billables_updated_at
  BEFORE UPDATE ON public.monthly_billables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_api_status_updated_at
  BEFORE UPDATE ON public.network_api_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default API status records
INSERT INTO public.network_api_status (network, is_connected, last_sync_at) VALUES
  ('impact', true, now() - interval '2 hours'),
  ('cj', true, now() - interval '4 hours'),
  ('shareasale', false, null);