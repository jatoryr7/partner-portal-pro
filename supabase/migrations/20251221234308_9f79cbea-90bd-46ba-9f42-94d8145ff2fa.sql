-- Add new columns to partners table
ALTER TABLE public.partners
ADD COLUMN submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN target_launch_date DATE,
ADD COLUMN primary_contact_name TEXT,
ADD COLUMN primary_contact_email TEXT,
ADD COLUMN secondary_contact_name TEXT,
ADD COLUMN secondary_contact_email TEXT;

-- Update creative_assets table to support new channel types
ALTER TABLE public.creative_assets DROP CONSTRAINT IF EXISTS creative_assets_channel_check;

-- Add new columns for expanded functionality
ALTER TABLE public.creative_assets
ADD COLUMN affiliate_platform TEXT,
ADD COLUMN driver_types TEXT[] DEFAULT '{}',
ADD COLUMN promo_copy TEXT,
ADD COLUMN context_instructions TEXT,
ADD COLUMN copy_from_native BOOLEAN DEFAULT false,
ADD COLUMN is_draft BOOLEAN DEFAULT true,
ADD COLUMN file_urls TEXT[] DEFAULT '{}';

-- Create storage bucket for partner assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-assets',
  'partner-assets',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for partner-assets bucket
CREATE POLICY "Users can upload their own partner assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'partner-assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view partner assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'partner-assets');

CREATE POLICY "Users can update their own partner assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'partner-assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own partner assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'partner-assets' AND
  auth.uid() IS NOT NULL
);