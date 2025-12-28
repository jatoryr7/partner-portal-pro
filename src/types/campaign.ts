export type CampaignPriority = 'high' | 'medium' | 'low';
export type CampaignStage = 'asset_collection' | 'new_submission' | 'creative_review' | 'partner_review' | 'ready_for_launch' | 'live';
export type FeedbackStatus = 'pending' | 'approved' | 'needs_revision';
export type ReviewStatus = 'pending' | 'approved' | 'revision_requested';

export interface CampaignStatus {
  id: string;
  partnerId: string;
  priority: CampaignPriority;
  stage: CampaignStage;
  nextMeetingDate: Date | null;
  campaignConclusionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetFeedback {
  id: string;
  assetId: string;
  status: FeedbackStatus;
  reviewerId: string | null;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminReview {
  id: string;
  campaignId: string;
  stepName: string;
  status: ReviewStatus;
  internalComments: string | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const STAGE_LABELS: Record<CampaignStage, string> = {
  asset_collection: 'Asset Collection',
  new_submission: 'New Submission',
  creative_review: 'Creative Review',
  partner_review: 'Partner Review',
  ready_for_launch: 'Ready for Launch',
  live: 'Live',
};

export const STAGE_ORDER: CampaignStage[] = [
  'asset_collection',
  'new_submission',
  'creative_review',
  'partner_review',
  'ready_for_launch',
  'live',
];

export const PRIORITY_COLORS: Record<CampaignPriority, { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  low: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
};

export const REVIEW_STEPS = [
  { id: 'company_info', title: 'Company Info' },
  { id: 'channels', title: 'Channels' },
  { id: 'creative_assets', title: 'Creative Assets' },
  { id: 'stakeholders', title: 'Stakeholders' },
  { id: 'summary', title: 'Summary' },
] as const;

export type ReviewStepId = typeof REVIEW_STEPS[number]['id'];