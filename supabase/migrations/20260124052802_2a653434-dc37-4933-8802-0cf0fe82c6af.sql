-- Fix partner-assets storage bucket: make it private
-- Only authenticated users should be able to view partner assets

UPDATE storage.buckets 
SET public = false 
WHERE id = 'partner-assets';

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view partner assets" ON storage.objects;

-- Create new policy: Only authenticated users can view partner assets
CREATE POLICY "Authenticated users can view partner assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'partner-assets');

-- Add rate-limiting awareness comment for public INSERT policies
-- brand_applications and public_review_requests intentionally allow public submissions
-- These are for the public Brand Integrity Portal and public review request forms

-- For brand_applications: Add basic validation that required fields exist
-- (The existing policy already allows public INSERT which is intentional for the portal)
-- We keep this intentional but add a note

-- For public_review_requests: Same - intentionally public for anonymous request forms