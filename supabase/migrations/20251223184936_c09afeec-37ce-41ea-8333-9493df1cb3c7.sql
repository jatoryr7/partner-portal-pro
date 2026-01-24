-- Allow partners to INSERT a campaign_status for their own partner record
CREATE POLICY "Partners can create their own campaign status"
ON public.campaign_status
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = campaign_status.partner_id
    AND partners.user_id = auth.uid()
  )
);