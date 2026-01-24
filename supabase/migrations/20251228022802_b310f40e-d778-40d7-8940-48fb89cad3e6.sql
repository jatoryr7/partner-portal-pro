-- Add RLS policies for admins to view partners table
CREATE POLICY "Admins can view all partners" 
ON public.partners 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for admins to view stakeholders table
CREATE POLICY "Admins can view all stakeholders" 
ON public.stakeholders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for admins to view creative_assets table
CREATE POLICY "Admins can view all creative assets" 
ON public.creative_assets 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));