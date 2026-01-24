-- Create enum for review status
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'revision_requested');

-- Create admin_reviews table
CREATE TABLE public.admin_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaign_status(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    status review_status NOT NULL DEFAULT 'pending',
    internal_comments TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_admin_reviews_campaign_id ON public.admin_reviews(campaign_id);
CREATE INDEX idx_admin_reviews_status ON public.admin_reviews(status);

-- Enable RLS
ALTER TABLE public.admin_reviews ENABLE ROW LEVEL SECURITY;

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.admin_reviews
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews"
ON public.admin_reviews
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Partners can view reviews linked to their campaigns
CREATE POLICY "Partners can view their own reviews"
ON public.admin_reviews
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.campaign_status cs
        JOIN public.partners p ON cs.partner_id = p.id
        WHERE cs.id = admin_reviews.campaign_id
        AND p.user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_admin_reviews_updated_at
BEFORE UPDATE ON public.admin_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();