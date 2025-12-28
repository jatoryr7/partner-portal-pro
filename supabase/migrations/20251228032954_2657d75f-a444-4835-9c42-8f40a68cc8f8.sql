-- Create status enum for inventory availability
CREATE TYPE public.inventory_availability AS ENUM ('available', 'pitched', 'booked');

-- Create content verticals table (top level)
CREATE TABLE public.content_verticals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sub-verticals table
CREATE TABLE public.content_sub_verticals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vertical_id UUID NOT NULL REFERENCES public.content_verticals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.content_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_vertical_id UUID NOT NULL REFERENCES public.content_sub_verticals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create K1 clusters table
CREATE TABLE public.content_k1_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.content_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  k1_code TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create articles table
CREATE TABLE public.content_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  k1_cluster_id UUID NOT NULL REFERENCES public.content_k1_clusters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  status inventory_availability NOT NULL DEFAULT 'available',
  monthly_pageviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad units table for each article
CREATE TABLE public.content_ad_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.content_articles(id) ON DELETE CASCADE,
  unit_type TEXT NOT NULL,
  status inventory_availability NOT NULL DEFAULT 'available',
  rate NUMERIC,
  deal_id UUID REFERENCES public.campaign_deals(id) ON DELETE SET NULL,
  pitched_at TIMESTAMP WITH TIME ZONE,
  booked_at TIMESTAMP WITH TIME ZONE,
  booked_start_date DATE,
  booked_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.content_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sub_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_k1_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ad_units ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_verticals
CREATE POLICY "Admins can manage verticals" ON public.content_verticals FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all verticals" ON public.content_verticals FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS policies for content_sub_verticals
CREATE POLICY "Admins can manage sub_verticals" ON public.content_sub_verticals FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all sub_verticals" ON public.content_sub_verticals FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS policies for content_categories
CREATE POLICY "Admins can manage categories" ON public.content_categories FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all categories" ON public.content_categories FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS policies for content_k1_clusters
CREATE POLICY "Admins can manage k1_clusters" ON public.content_k1_clusters FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all k1_clusters" ON public.content_k1_clusters FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS policies for content_articles
CREATE POLICY "Admins can manage articles" ON public.content_articles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all articles" ON public.content_articles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS policies for content_ad_units
CREATE POLICY "Admins can manage ad_units" ON public.content_ad_units FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all ad_units" ON public.content_ad_units FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Add updated_at triggers
CREATE TRIGGER update_content_verticals_updated_at BEFORE UPDATE ON public.content_verticals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_sub_verticals_updated_at BEFORE UPDATE ON public.content_sub_verticals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON public.content_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_k1_clusters_updated_at BEFORE UPDATE ON public.content_k1_clusters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_articles_updated_at BEFORE UPDATE ON public.content_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_ad_units_updated_at BEFORE UPDATE ON public.content_ad_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();