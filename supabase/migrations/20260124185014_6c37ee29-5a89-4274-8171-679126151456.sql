-- Add affiliate and website fields to partners table for public directory
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS affiliate_link TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.partners.affiliate_link IS 'Primary affiliate tracking link for conversions';
COMMENT ON COLUMN public.partners.website IS 'Brand official website (fallback if no affiliate link)';
COMMENT ON COLUMN public.partners.category IS 'Brand category (supplements, wearables, telehealth, etc.)';