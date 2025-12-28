-- Add assigned_manager_id column to partners table
ALTER TABLE public.partners 
ADD COLUMN assigned_manager_id uuid REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX idx_partners_assigned_manager ON public.partners(assigned_manager_id);