-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'partner');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create campaign_status table
CREATE TABLE public.campaign_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL UNIQUE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    stage TEXT NOT NULL DEFAULT 'asset_collection' CHECK (stage IN ('asset_collection', 'internal_review', 'live', 'concluded')),
    next_meeting_date TIMESTAMP WITH TIME ZONE,
    campaign_conclusion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_status ENABLE ROW LEVEL SECURITY;

-- Campaign status policies
CREATE POLICY "Partners can view their own campaign status"
ON public.campaign_status
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM partners 
    WHERE partners.id = campaign_status.partner_id 
    AND partners.user_id = auth.uid()
));

CREATE POLICY "Admins can view all campaign statuses"
ON public.campaign_status
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage campaign statuses"
ON public.campaign_status
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create asset_feedback table
CREATE TABLE public.asset_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.creative_assets(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs_revision')),
    reviewer_id UUID REFERENCES auth.users(id),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_feedback ENABLE ROW LEVEL SECURITY;

-- Asset feedback policies
CREATE POLICY "Partners can view feedback on their assets"
ON public.asset_feedback
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM creative_assets ca
    JOIN partners p ON ca.partner_id = p.id
    WHERE ca.id = asset_feedback.asset_id 
    AND p.user_id = auth.uid()
));

CREATE POLICY "Admins can view all feedback"
ON public.asset_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage feedback"
ON public.asset_feedback
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for campaign_status updated_at
CREATE TRIGGER update_campaign_status_updated_at
BEFORE UPDATE ON public.campaign_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for asset_feedback updated_at
CREATE TRIGGER update_asset_feedback_updated_at
BEFORE UPDATE ON public.asset_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create profiles table for user metadata
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
    
    -- Default new users to partner role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'partner');
    
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();