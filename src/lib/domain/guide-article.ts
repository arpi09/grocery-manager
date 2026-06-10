export const GUIDE_ARTICLE_STATUSES = ['draft', 'approved', 'published'] as const;
export type GuideArticleStatus = (typeof GUIDE_ARTICLE_STATUSES)[number];

export const GUIDE_ARTICLE_SOURCES = ['agent', 'manual'] as const;
export type GuideArticleSource = (typeof GUIDE_ARTICLE_SOURCES)[number];

export interface GuideArticle {
	id: string;
	slug: string;
	title: string;
	description: string;
	body: string;
	keywords: string[];
	articleDate: string;
	status: GuideArticleStatus;
	source: GuideArticleSource;
	socialPostId: string | null;
	qualityWarnings: string[] | null;
	approvedBy: string | null;
	approvedAt: Date | null;
	publishedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateGuideArticleDraftInput {
	slug: string;
	title: string;
	description: string;
	body: string;
	keywords: string[];
	articleDate: string;
	socialPostId?: string | null;
	qualityWarnings?: string[] | null;
	source?: GuideArticleSource;
}

export interface UpdateGuideArticleInput {
	title?: string;
	description?: string;
	body?: string;
	keywords?: string[];
}

export const GUIDE_ARTICLE_LIST_DEFAULT = 20;
export const GUIDE_ARTICLE_LIST_MAX = 100;
