export type ChannelKey = "native" | "paidSocialSearch" | "media" | "newsletter" | "contentMarketing";

export interface PartnerData {
  companyName: string;
  submissionDate: Date;
  targetLaunchDate: Date | null;
  primaryContact: ContactInfo;
  secondaryContact: ContactInfo | null;
  stakeholders: Stakeholder[];
  selectedChannels: ChannelKey[];
  channels: ChannelData;
}

export interface ContactInfo {
  name: string;
  email: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface ChannelData {
  native: NativeChannelAssets;
  paidSocialSearch: PaidSocialSearchAssets;
  media: StandardChannelAssets;
  newsletter: StandardChannelAssets;
  contentMarketing: StandardChannelAssets;
}

export interface BaseChannelAssets {
  completed: boolean;
  isDraft: boolean;
  fileUrls: string[];
}

export interface NativeChannelAssets extends BaseChannelAssets {
  affiliatePlatform: string;
  driverTypes: string[];
  promoCopy: string;
  affiliateLink: string;
}

export interface PaidSocialSearchAssets extends BaseChannelAssets {
  mediaPlatform: string;
  copyFromNative: boolean;
  affiliateLink: string;
  copy: string;
}

export interface StandardChannelAssets extends BaseChannelAssets {
  contextInstructions: string;
  affiliateLink: string;
}

export const AFFILIATE_PLATFORMS = [
  "Levanta",
  "AWIN",
  "CJ",
  "Connexity",
  "Everflow",
  "HasOffers",
  "ImpactRadius",
  "Katalys",
  "Pepperjam",
  "Rakuten",
  "Refersion",
  "Skimlinks",
] as const;

export const DRIVER_TYPES = [
  "Social proof driver",
  "Multi-product widget inclusion",
] as const;

export const MEDIA_PLATFORMS = [
  "Meta",
  "Google",
  "TikTok",
  "YouTube",
  "Podcast",
] as const;

export const initialChannelData: ChannelData = {
  native: {
    affiliatePlatform: "",
    driverTypes: [],
    promoCopy: "",
    affiliateLink: "",
    fileUrls: [],
    completed: false,
    isDraft: true,
  },
  paidSocialSearch: {
    mediaPlatform: "",
    copyFromNative: false,
    affiliateLink: "",
    copy: "",
    fileUrls: [],
    completed: false,
    isDraft: true,
  },
  media: {
    contextInstructions: "",
    affiliateLink: "",
    fileUrls: [],
    completed: false,
    isDraft: true,
  },
  newsletter: {
    contextInstructions: "",
    affiliateLink: "",
    fileUrls: [],
    completed: false,
    isDraft: true,
  },
  contentMarketing: {
    contextInstructions: "",
    affiliateLink: "",
    fileUrls: [],
    completed: false,
    isDraft: true,
  },
};

export const initialPartnerData: PartnerData = {
  companyName: "",
  submissionDate: new Date(),
  targetLaunchDate: null,
  primaryContact: { name: "", email: "" },
  secondaryContact: null,
  stakeholders: [],
  selectedChannels: [],
  channels: initialChannelData,
};
