-- Create public brand review requests table (for viral "Request a Review" feature)
CREATE TABLE public.public_review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  brand_url TEXT,
  requester_email TEXT,
  requester_name TEXT,
  request_count INTEGER NOT NULL DEFAULT 1,
  share_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand applications table (multi-step form submissions)
CREATE TABLE public.brand_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracker_id TEXT NOT NULL DEFAULT 'MR-' || to_char(now(), 'YYYYMMDD') || '-' || upper(encode(gen_random_bytes(4), 'hex')),
  
  -- Step 1: Brand & Product Meta
  brand_name TEXT NOT NULL,
  brand_url TEXT,
  category TEXT,
  primary_health_goal TEXT,
  
  -- Step 2: Scientific Evidence (file URLs stored in Supabase Storage)
  coa_file_urls TEXT[] DEFAULT '{}',
  clinical_trial_links TEXT[] DEFAULT '{}',
  ingredient_docs_urls TEXT[] DEFAULT '{}',
  
  -- Step 3: Contact & Business Intel
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_name TEXT,
  estimated_monthly_revenue TEXT,
  
  -- Payment & Status
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  review_fee_amount INTEGER DEFAULT 0,
  
  -- Workflow Status
  status TEXT NOT NULL DEFAULT 'pending_payment',
  medical_review_id UUID REFERENCES public.medical_reviews(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.public_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;

-- Public review requests: Anyone can create, anyone can view count
CREATE POLICY "Anyone can create review requests"
ON public.public_review_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view review requests"
ON public.public_review_requests
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage review requests"
ON public.public_review_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Brand applications: Public can create, only applicant or admin can view
CREATE POLICY "Anyone can submit brand applications"
ON public.brand_applications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Applicants can view their own applications by tracker_id"
ON public.brand_applications
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all brand applications"
ON public.brand_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_public_review_requests_updated_at
BEFORE UPDATE ON public.public_review_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_applications_updated_at
BEFORE UPDATE ON public.brand_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false);

-- Storage policies for application documents
CREATE POLICY "Anyone can upload application documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Admins can view application documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'application-documents' AND has_role(auth.uid(), 'admin'::app_role));