export const SOCIAL_POST_CHANNELS = ['linkedin'] as const;
export type SocialPostChannel = (typeof SOCIAL_POST_CHANNELS)[number];

export const SOCIAL_POST_STATUSES = ['draft', 'approved', 'published', 'failed'] as const;
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number];

export const SOCIAL_POST_SOURCES = ['agent', 'manual', 'automation'] as const;
export type SocialPostSource = (typeof SOCIAL_POST_SOURCES)[number];

export interface SocialPost {
	id: string;
	channel: SocialPostChannel;
	status: SocialPostStatus;
	title: string | null;
	body: string;
	linkUrl: string | null;
	utmSource: string | null;
	utmMedium: string | null;
	utmCampaign: string | null;
	utmContent: string | null;
	imagePath: string | null;
	source: SocialPostSource;
	approvedBy: string | null;
	approvedAt: Date | null;
	publishedAt: Date | null;
	externalId: string | null;
	publishError: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateSocialPostDraftInput {
	channel?: SocialPostChannel;
	title?: string | null;
	body: string;
	linkUrl?: string | null;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
	utmContent?: string | null;
	imagePath?: string | null;
	source?: SocialPostSource;
}

export interface UpdateSocialPostInput {
	title?: string | null;
	body?: string;
	linkUrl?: string | null;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
	utmContent?: string | null;
	imagePath?: string | null;
}

export const SOCIAL_POST_LIST_DEFAULT = 20;
export const SOCIAL_POST_LIST_MAX = 100;

export const LINKEDIN_SEED_DRAFT_TITLE = 'Growth repost — juni';
