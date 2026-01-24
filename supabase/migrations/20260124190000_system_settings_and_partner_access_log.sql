-- system_settings: key-value store for maintenance_mode etc.
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null'
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system_settings"
  ON public.system_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.system_settings (key, value)
VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- RPC: get partner access log (email, organization, last_sign_in, user_id).
-- Uses auth.users for last_sign_in; only callable by admins.
CREATE OR REPLACE FUNCTION public.get_partner_access_log()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  organization_name TEXT,
  last_sign_in_at TIMESTAMPTZ,
  partner_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    p.email,
    pt.company_name,
    u.last_sign_in_at,
    pt.id AS partner_id
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  JOIN public.partners pt ON pt.user_id = ur.user_id
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role = 'partner'
  ORDER BY u.last_sign_in_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_access_log() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_access_log() TO service_role;
