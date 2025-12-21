-- Create partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stakeholders table
CREATE TABLE public.stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creative_assets table
CREATE TABLE public.creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('meta', 'tiktok', 'google', 'youtube', 'linkedin')),
  asset_url TEXT,
  copy_text TEXT,
  affiliate_link TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partners
CREATE POLICY "Users can view their own partners" 
ON public.partners FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own partners" 
ON public.partners FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partners" 
ON public.partners FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own partners" 
ON public.partners FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for stakeholders (through partner ownership)
CREATE POLICY "Users can view stakeholders of their partners" 
ON public.stakeholders FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = stakeholders.partner_id 
  AND partners.user_id = auth.uid()
));

CREATE POLICY "Users can create stakeholders for their partners" 
ON public.stakeholders FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = stakeholders.partner_id 
  AND partners.user_id = auth.uid()
));

CREATE POLICY "Users can update stakeholders of their partners" 
ON public.stakeholders FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = stakeholders.partner_id 
  AND partners.user_id = auth.uid()
));

CREATE POLICY "Users can delete stakeholders of their partners" 
ON public.stakeholders FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = stakeholders.partner_id 
  AND partners.user_id = auth.uid()
));

-- RLS Policies for creative_assets (through partner ownership)
CREATE POLICY "Users can view assets of their partners" 
ON public.creative_assets FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = creative_assets.partner_id 
  AND partners.user_id = auth.uid()
));

CREATE POLICY "Users can create assets for their partners" 
ON public.creative_assets FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = creative_assets.partner_id 
  AND partners.user_id = auth.uid()
));

CREATE POLICY "Users can update assets of their partners" 
ON public.creative_assets FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = creative_assets.partner_id 
  AND partners.user_id = auth.uid()
));

CREATE POLICY "Users can delete assets of their partners" 
ON public.creative_assets FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.partners 
  WHERE partners.id = creative_assets.partner_id 
  AND partners.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creative_assets_updated_at
BEFORE UPDATE ON public.creative_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();