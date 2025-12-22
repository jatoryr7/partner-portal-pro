export type CampaignPriority = 'high' | 'medium' | 'low';
export type CampaignStage = 'asset_collection' | 'internal_review' | 'live' | 'concluded';
export type FeedbackStatus = 'pending' | 'approved' | 'needs_revision';

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

export const STAGE_LABELS: Record<CampaignStage, string> = {
  asset_collection: 'Asset Collection',
  internal_review: 'Internal Review',
  live: 'Live',
  concluded: 'Concluded',
};

export const STAGE_ORDER: CampaignStage[] = [
  'asset_collection',
  'internal_review',
  'live',
  'concluded',
];

export const PRIORITY_COLORS: Record<CampaignPriority, { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  low: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
};
