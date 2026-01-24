/**
 * ============================================================================
 * COMMAND CENTER INPUT OPTIONS CONFIGURATION
 * ============================================================================
 * 
 * This file centralizes all dropdown options, select values, and input 
 * configurations used throughout the Command Center. Update these values
 * to customize the options available in forms and filters.
 * 
 * INSTRUCTIONS:
 * 1. Find the section for the input you want to modify
 * 2. Add, remove, or edit the options as needed
 * 3. Save the file - changes will apply across the application
 * 
 * ============================================================================
 */

// ============================================================================
// SECTION 1: LEAD CAPTURE & SALES PIPELINE
// ============================================================================

/**
 * Industries available in Lead Capture form
 * Used in: LeadCaptureDialog.tsx
 */
export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Media & Entertainment',
  'Travel & Hospitality',
  'Education',
  'Real Estate',
  'Consumer Goods',
  'Pharmaceuticals',
  'Insurance',
  'Automotive',
  'Food & Beverage',
  'Energy',
  'Other',
] as const;

/**
 * Lead sources for tracking where prospects come from
 * Used in: LeadCaptureDialog.tsx
 */
export const LEAD_SOURCES = [
  'Referral',
  'Cold Outreach',
  'Inbound Lead',
  'Conference/Event',
  'LinkedIn',
  'Website',
  'Partner Network',
  'Trade Publication',
  'Webinar',
  'Existing Client Upsell',
  'Other',
] as const;

/**
 * Pipeline stages for sales funnel tracking
 * Used in: PipelineKanban.tsx, BusinessDevDashboard.tsx
 * NOTE: These must match the database enum 'pipeline_stage'
 */
export const PIPELINE_STAGES = [
  { value: 'prospecting', label: 'Prospecting', color: 'bg-slate-500' },
  { value: 'initial_pitch', label: 'Initial Pitch', color: 'bg-blue-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-amber-500' },
  { value: 'contract_sent', label: 'Contract Sent', color: 'bg-purple-500' },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
] as const;

// ============================================================================
// SECTION 2: ANALYST BRIEFING & INSIGHTS
// ============================================================================

/**
 * Priority tags for analyst briefings and updates
 * Used in: AnalystBriefingDesk.tsx
 */
export const PRIORITY_TAGS = [
  { value: 'fyi', label: 'FYI', color: 'secondary', description: 'For information only' },
  { value: 'action_required', label: 'Action Required', color: 'warning', description: 'Needs attention this week' },
  { value: 'critical', label: 'Critical', color: 'destructive', description: 'Requires immediate action' },
] as const;

// ============================================================================
// SECTION 3: CONTRACTS & INSERTION ORDERS
// ============================================================================

/**
 * Contract status options for deals/insertion orders
 * Used in: InsertionOrdersView.tsx
 * NOTE: These must match the database enum 'contract_status'
 */
export const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft', icon: 'Clock', color: 'amber' },
  { value: 'signed', label: 'Signed', icon: 'CheckCircle', color: 'green' },
  { value: 'expired', label: 'Expired', icon: 'XCircle', color: 'red' },
] as const;

// ============================================================================
// SECTION 4: CONTENT INVENTORY & AD UNITS
// ============================================================================

/**
 * Ad unit types available for content slots
 * Used in: ContentInventoryExplorer.tsx
 */
export const AD_UNIT_TYPES = [
  { value: 'leaderboard', label: 'Leaderboard', icon: 'Layout' },
  { value: 'native', label: 'Native', icon: 'FileText' },
  { value: 'video', label: 'Video', icon: 'Video' },
  { value: 'newsletter', label: 'Newsletter', icon: 'Mail' },
  { value: 'sponsored_content', label: 'Sponsored Content', icon: 'FileText' },
  { value: 'display', label: 'Display', icon: 'Tv' },
] as const;

/**
 * Inventory availability statuses
 * Used in: ContentInventoryExplorer.tsx, PlacementsTable.tsx
 * NOTE: These must match the database enum 'inventory_availability'
 */
export const INVENTORY_STATUSES = [
  { value: 'available', label: 'Available', color: 'emerald' },
  { value: 'pitched', label: 'Pitched', color: 'amber' },
  { value: 'booked', label: 'Booked', color: 'rose' },
] as const;

/**
 * Placement status options
 * NOTE: These must match the database enum 'placement_status'
 */
export const PLACEMENT_STATUSES = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'pitched', label: 'Pitched', color: 'amber' },
  { value: 'booked', label: 'Booked', color: 'red' },
  { value: 'upcoming', label: 'Upcoming', color: 'blue' },
] as const;

// ============================================================================
// SECTION 5: BRAND & CAMPAIGN MANAGEMENT
// ============================================================================

/**
 * Campaign stages for brand workflow tracking
 * Used in: BrandDirectory.tsx, CampaignStatusHeader.tsx
 */
export const CAMPAIGN_STAGES = [
  { value: 'intake', label: 'Intake', color: 'blue' },
  { value: 'asset_collection', label: 'Asset Collection', color: 'amber' },
  { value: 'in_progress', label: 'In Progress', color: 'purple' },
  { value: 'review', label: 'Review', color: 'cyan' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'live', label: 'Live', color: 'emerald' },
  { value: 'completed', label: 'Completed', color: 'slate' },
] as const;

/**
 * Priority levels for campaigns and tasks
 * Used in: BrandDirectory.tsx, CampaignStatusHeader.tsx
 */
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'slate' },
  { value: 'medium', label: 'Medium', color: 'amber' },
  { value: 'high', label: 'High', color: 'red' },
] as const;

/**
 * Stakeholder roles within partner organizations
 * Used in: StepStakeholders.tsx
 */
export const STAKEHOLDER_ROLES = [
  'Marketing Director',
  'Brand Manager',
  'CMO',
  'VP Marketing',
  'Digital Marketing Manager',
  'Creative Director',
  'Product Manager',
  'Account Executive',
  'Media Buyer',
  'Other',
] as const;

// ============================================================================
// SECTION 6: CREATIVE ASSETS & CHANNELS
// ============================================================================

/**
 * Marketing channels for creative assets
 * Used in: StepChannelSelection.tsx, CreativeAssets views
 */
export const MARKETING_CHANNELS = [
  { value: 'native', label: 'Native Content', icon: 'FileText' },
  { value: 'newsletter', label: 'Newsletter', icon: 'Mail' },
  { value: 'paid_social', label: 'Paid Social', icon: 'Share2' },
  { value: 'content_marketing', label: 'Content Marketing', icon: 'BookOpen' },
  { value: 'display', label: 'Display Ads', icon: 'Monitor' },
  { value: 'video', label: 'Video', icon: 'Video' },
] as const;

/**
 * Driver types for campaign optimization
 * Used in: StepCreativeAssets.tsx
 */
export const DRIVER_TYPES = [
  'Brand Awareness',
  'Lead Generation',
  'Direct Response',
  'Product Launch',
  'Thought Leadership',
  'Retargeting',
  'Conversion',
] as const;

/**
 * Affiliate platforms for tracking
 * Used in: Creative asset forms
 */
export const AFFILIATE_PLATFORMS = [
  'Impact',
  'CJ Affiliate',
  'ShareASale',
  'Rakuten',
  'Awin',
  'PartnerStack',
  'Refersion',
  'Custom/Direct',
  'Other',
] as const;

// ============================================================================
// SECTION 7: PERFORMANCE & ANALYTICS
// ============================================================================

/**
 * Sort options for performance feed
 * Used in: PerformanceFeedView.tsx
 */
export const PERFORMANCE_SORT_OPTIONS = [
  { value: 'revenue', label: 'Sort by Revenue' },
  { value: 'roas', label: 'Sort by ROAS' },
  { value: 'cac', label: 'Sort by CAC' },
  { value: 'conversions', label: 'Sort by Conversions' },
] as const;

/**
 * Time period filters for analytics
 * Used in: Various dashboard components
 */
export const TIME_PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '14d', label: 'Last 14 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'mtd', label: 'Month to Date' },
  { value: 'qtd', label: 'Quarter to Date' },
  { value: 'ytd', label: 'Year to Date' },
] as const;

// ============================================================================
// SECTION 8: REVIEW & APPROVAL WORKFLOW
// ============================================================================

/**
 * Review status options
 * NOTE: These must match the database enum 'review_status'
 */
export const REVIEW_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: 'amber' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'revision_requested', label: 'Revision Requested', color: 'red' },
] as const;

// ============================================================================
// SECTION 9: PROPERTIES & PLATFORMS
// ============================================================================

/**
 * Publisher properties for inventory management
 * Used in: PlacementsTable.tsx, ContentInventoryExplorer.tsx
 * 
 * TODO: Add your actual publisher properties here
 */
export const PUBLISHER_PROPERTIES = [
  'Healthline',
  'Medical News Today',
  'Greatist',
  'Psych Central',
  'Bezzy',
  // Add more properties as needed
] as const;

// ============================================================================
// SECTION 10: FUNNEL STAGES (DEALS)
// ============================================================================

/**
 * Funnel stages for deal tracking
 * NOTE: These must match the database enum 'funnel_stage'
 */
export const FUNNEL_STAGES = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
] as const;

// ============================================================================
// TYPE EXPORTS (for TypeScript support)
// ============================================================================

export type Industry = (typeof INDUSTRIES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number]['value'];
export type PriorityTag = (typeof PRIORITY_TAGS)[number]['value'];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]['value'];
export type AdUnitType = (typeof AD_UNIT_TYPES)[number]['value'];
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number]['value'];
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number]['value'];
export type CampaignStage = (typeof CAMPAIGN_STAGES)[number]['value'];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number]['value'];
export type StakeholderRole = (typeof STAKEHOLDER_ROLES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number]['value'];
export type DriverType = (typeof DRIVER_TYPES)[number];
export type AffiliatePlatform = (typeof AFFILIATE_PLATFORMS)[number];
export type TimePeriod = (typeof TIME_PERIODS)[number]['value'];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]['value'];
export type PublisherProperty = (typeof PUBLISHER_PROPERTIES)[number];
export type FunnelStage = (typeof FUNNEL_STAGES)[number]['value'];
