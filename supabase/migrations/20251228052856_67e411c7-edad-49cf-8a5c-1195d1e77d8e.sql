-- Create app_configurations table for dynamic input options management
CREATE TABLE public.app_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT,
  description TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(category, key)
);

-- Enable RLS
ALTER TABLE public.app_configurations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all configurations
CREATE POLICY "Admins can manage configurations"
ON public.app_configurations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view configurations (needed for form dropdowns)
CREATE POLICY "Authenticated users can view configurations"
ON public.app_configurations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_app_configurations_updated_at
BEFORE UPDATE ON public.app_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data from existing constants
INSERT INTO public.app_configurations (category, key, label, value, sort_order, color) VALUES
-- Industries
('industries', 'healthcare', 'Healthcare', 'healthcare', 1, NULL),
('industries', 'biotech', 'Biotech', 'biotech', 2, NULL),
('industries', 'wellness', 'Wellness', 'wellness', 3, NULL),
('industries', 'pharma', 'Pharma', 'pharma', 4, NULL),
('industries', 'medtech', 'MedTech', 'medtech', 5, NULL),
('industries', 'cpg', 'CPG', 'cpg', 6, NULL),
('industries', 'financial_services', 'Financial Services', 'financial_services', 7, NULL),
('industries', 'insurance', 'Insurance', 'insurance', 8, NULL),
('industries', 'telehealth', 'Telehealth', 'telehealth', 9, NULL),
('industries', 'supplements', 'Supplements', 'supplements', 10, NULL),

-- Lead Sources
('lead_sources', 'inbound_web', 'Inbound (Web)', 'inbound_web', 1, NULL),
('lead_sources', 'referral', 'Referral', 'referral', 2, NULL),
('lead_sources', 'conference', 'Conference', 'conference', 3, NULL),
('lead_sources', 'outbound', 'Outbound', 'outbound', 4, NULL),
('lead_sources', 'partner', 'Partner', 'partner', 5, NULL),
('lead_sources', 'existing_client', 'Existing Client', 'existing_client', 6, NULL),

-- Pipeline Stages
('pipeline_stages', 'prospecting', 'Prospecting', 'prospecting', 1, '#6B7280'),
('pipeline_stages', 'qualified', 'Qualified', 'qualified', 2, '#3B82F6'),
('pipeline_stages', 'negotiation', 'Negotiation', 'negotiation', 3, '#F59E0B'),
('pipeline_stages', 'won', 'Won', 'won', 4, '#10B981'),

-- Priority Tags
('priority_tags', 'fyi', 'FYI', 'fyi', 1, '#3B82F6'),
('priority_tags', 'action_required', 'Action Required', 'action_required', 2, '#F59E0B'),
('priority_tags', 'critical', 'Critical', 'critical', 3, '#EF4444'),

-- Contract Statuses
('contract_statuses', 'draft', 'Draft', 'draft', 1, '#6B7280'),
('contract_statuses', 'signed', 'Signed', 'signed', 2, '#10B981'),
('contract_statuses', 'expired', 'Expired', 'expired', 3, '#EF4444'),

-- Ad Unit Types
('ad_unit_types', 'leaderboard', 'Leaderboard', 'leaderboard', 1, NULL),
('ad_unit_types', 'native', 'Native', 'native', 2, NULL),
('ad_unit_types', 'video', 'Video', 'video', 3, NULL),
('ad_unit_types', 'newsletter', 'Newsletter', 'newsletter', 4, NULL),

-- Inventory Statuses
('inventory_statuses', 'available', 'Available', 'available', 1, '#10B981'),
('inventory_statuses', 'pitched', 'Pitched', 'pitched', 2, '#F59E0B'),
('inventory_statuses', 'booked', 'Booked', 'booked', 3, '#3B82F6'),

-- Placement Statuses
('placement_statuses', 'available', 'Available', 'available', 1, '#10B981'),
('placement_statuses', 'pitched', 'Pitched', 'pitched', 2, '#F59E0B'),
('placement_statuses', 'booked', 'Booked', 'booked', 3, '#3B82F6'),
('placement_statuses', 'upcoming', 'Upcoming', 'upcoming', 4, '#8B5CF6'),

-- Campaign Stages
('campaign_stages', 'asset_collection', 'Asset Collection', 'asset_collection', 1, NULL),
('campaign_stages', 'internal_review', 'Internal Review', 'internal_review', 2, NULL),
('campaign_stages', 'creative_development', 'Creative Development', 'creative_development', 3, NULL),
('campaign_stages', 'partner_approval', 'Partner Approval', 'partner_approval', 4, NULL),
('campaign_stages', 'live', 'Live', 'live', 5, NULL),
('campaign_stages', 'complete', 'Complete', 'complete', 6, NULL),

-- Priority Levels
('priority_levels', 'critical', 'Critical', 'critical', 1, '#EF4444'),
('priority_levels', 'high', 'High', 'high', 2, '#F59E0B'),
('priority_levels', 'medium', 'Medium', 'medium', 3, '#3B82F6'),
('priority_levels', 'low', 'Low', 'low', 4, '#6B7280'),

-- Marketing Channels
('marketing_channels', 'native', 'Native', 'native', 1, NULL),
('marketing_channels', 'newsletter', 'Newsletter', 'newsletter', 2, NULL),
('marketing_channels', 'paid_social', 'Paid Social', 'paid_social', 3, NULL),
('marketing_channels', 'media', 'Media', 'media', 4, NULL),
('marketing_channels', 'content_marketing', 'Content Marketing', 'content_marketing', 5, NULL),

-- Driver Types
('driver_types', 'awareness', 'Awareness', 'awareness', 1, NULL),
('driver_types', 'consideration', 'Consideration', 'consideration', 2, NULL),
('driver_types', 'conversion', 'Conversion', 'conversion', 3, NULL),
('driver_types', 'retention', 'Retention', 'retention', 4, NULL),

-- Affiliate Platforms
('affiliate_platforms', 'impact', 'Impact', 'impact', 1, NULL),
('affiliate_platforms', 'cj', 'CJ Affiliate', 'cj', 2, NULL),
('affiliate_platforms', 'rakuten', 'Rakuten', 'rakuten', 3, NULL),
('affiliate_platforms', 'shareasale', 'ShareASale', 'shareasale', 4, NULL),
('affiliate_platforms', 'partnerize', 'Partnerize', 'partnerize', 5, NULL),
('affiliate_platforms', 'awin', 'Awin', 'awin', 6, NULL),
('affiliate_platforms', 'none', 'None / Direct', 'none', 7, NULL),

-- Stakeholder Roles
('stakeholder_roles', 'marketing_lead', 'Marketing Lead', 'marketing_lead', 1, NULL),
('stakeholder_roles', 'brand_manager', 'Brand Manager', 'brand_manager', 2, NULL),
('stakeholder_roles', 'creative_director', 'Creative Director', 'creative_director', 3, NULL),
('stakeholder_roles', 'analytics_lead', 'Analytics Lead', 'analytics_lead', 4, NULL),
('stakeholder_roles', 'executive_sponsor', 'Executive Sponsor', 'executive_sponsor', 5, NULL),
('stakeholder_roles', 'legal_compliance', 'Legal/Compliance', 'legal_compliance', 6, NULL),
('stakeholder_roles', 'agency_contact', 'Agency Contact', 'agency_contact', 7, NULL),

-- Publisher Properties
('publisher_properties', 'healthline', 'Healthline', 'Healthline', 1, NULL),
('publisher_properties', 'medical_news_today', 'Medical News Today', 'Medical News Today', 2, NULL),
('publisher_properties', 'psych_central', 'Psych Central', 'Psych Central', 3, NULL),
('publisher_properties', 'greatist', 'Greatist', 'Greatist', 4, NULL),
('publisher_properties', 'bezzy', 'Bezzy', 'Bezzy', 5, NULL),

-- Time Periods
('time_periods', '7d', 'Last 7 Days', '7d', 1, NULL),
('time_periods', '30d', 'Last 30 Days', '30d', 2, NULL),
('time_periods', '90d', 'Last 90 Days', '90d', 3, NULL),
('time_periods', 'mtd', 'Month to Date', 'mtd', 4, NULL),
('time_periods', 'qtd', 'Quarter to Date', 'qtd', 5, NULL),
('time_periods', 'ytd', 'Year to Date', 'ytd', 6, NULL),

-- Review Statuses
('review_statuses', 'pending', 'Pending', 'pending', 1, '#F59E0B'),
('review_statuses', 'approved', 'Approved', 'approved', 2, '#10B981'),
('review_statuses', 'revision_requested', 'Revision Requested', 'revision_requested', 3, '#EF4444'),

-- Funnel Stages
('funnel_stages', 'prospecting', 'Prospecting', 'prospecting', 1, '#6B7280'),
('funnel_stages', 'qualification', 'Qualification', 'qualification', 2, '#3B82F6'),
('funnel_stages', 'proposal', 'Proposal', 'proposal', 3, '#8B5CF6'),
('funnel_stages', 'negotiation', 'Negotiation', 'negotiation', 4, '#F59E0B'),
('funnel_stages', 'closed_won', 'Closed Won', 'closed_won', 5, '#10B981'),
('funnel_stages', 'closed_lost', 'Closed Lost', 'closed_lost', 6, '#EF4444');