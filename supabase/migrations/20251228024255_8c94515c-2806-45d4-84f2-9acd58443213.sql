-- Create brand_comments table for activity feed with @-mentions
CREATE TABLE public.brand_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all comments"
ON public.brand_comments
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create comments"
ON public.brand_comments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = author_id);

CREATE POLICY "Admins can update their own comments"
ON public.brand_comments
FOR UPDATE
USING (has_role(auth.uid(), 'admin') AND auth.uid() = author_id);

CREATE POLICY "Admins can delete their own comments"
ON public.brand_comments
FOR DELETE
USING (has_role(auth.uid(), 'admin') AND auth.uid() = author_id);

-- Create trigger for updated_at
CREATE TRIGGER update_brand_comments_updated_at
BEFORE UPDATE ON public.brand_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_brand_comments_partner_id ON public.brand_comments(partner_id);
CREATE INDEX idx_brand_comments_author_id ON public.brand_comments(author_id);
CREATE INDEX idx_brand_comments_created_at ON public.brand_comments(created_at DESC);