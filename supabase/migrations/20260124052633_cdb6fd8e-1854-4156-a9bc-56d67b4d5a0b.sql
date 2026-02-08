-- Fix overly permissive RLS policy on brand_applications
-- The current policy with USING(true) allows anyone to read all applications

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Applicants can view their own applications by tracker_id" ON public.brand_applications;

-- Create policy allowing admins to view all applications
CREATE POLICY "Admins can view all brand applications"
ON public.brand_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create policy for applicants to view their own application via tracker_id
-- This uses an RPC approach where tracker_id must be provided in the query
CREATE POLICY "Applicants can view own application by tracker_id"
ON public.brand_applications
FOR SELECT
TO anon, authenticated
USING (
  -- Allow access only when filtering by the application's own tracker_id
  -- The tracker_id must match what's being queried
  tracker_id = current_setting('request.headers', true)::json->>'x-tracker-id'
);

-- Keep existing insert policy for public submissions
-- (no changes needed for INSERT policy)