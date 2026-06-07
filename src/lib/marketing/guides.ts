import { appendSearchParamsToAppPath } from '$lib/marketing/utm-params';

export interface GuideFrontmatter {
	title: string;
	description: string;
	date: string;
	keywords: string[];
	published: boolean;
}

export interface Guide extends GuideFrontmatter {
	slug: string;
	body: string;
	html: string;
	wordCount: number;
}

export interface GuideListItem {
	slug: string;
	title: string;
	description: string;
	date: string;
	keywords: string[];
}

/** SEO keyword batches for the AI generator (from COMPETITIVE_ANALYSIS §10). */
export const GUIDE_KEYWORD_MATRIX = [
	{
		topic: 'minska matsvinn hemma',
		primaryKeyword: 'minska matsvinn hemma app',
		angle: 'Lager som sanningskälla, utgångsdatum och Veckan fixad'
	},
	{
		topic: 'skafferi app hushåll',
		primaryKeyword: 'skafferi app hushåll',
		angle: 'Butiksneutralt skafferi för hela familjen'
	},
	{
		topic: 'inköpslista kylskåp synka',
		primaryKeyword: 'inköpslista kylskåp synka',
		angle: 'Inköpslista som speglar kyl, frys och skafferi'
	},
	{
		topic: 'kvitto pdf inköpslista',
		primaryKeyword: 'kvitto pdf till inköpslista',
		angle: 'Kivra-PDF och kvitto-autopilot i Skaffu'
	},
	{
		topic: 'utgångsdatum kylskåp',
		primaryKeyword: 'utgångsdatum kylskåp app',
		angle: 'Ät det först och varningar innan mat kastas'
	},
	{
		topic: 'butiksneutral inköpslista',
		primaryKeyword: 'butiksneutral inköpslista',
		angle: 'Jämförelse mot ICA/Bring utan kedjelåsning'
	}
] as const;

/** Slug for a guide file from its primary SEO keyword (matches generate-guide-article.ts). */
export function slugForGuideKeyword(primaryKeyword: string): string {
	return primaryKeyword
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

/** UTM params for guide CTA links: utm_campaign=seo-guide&utm_content={slug}. */
export function guideCtaSearchParams(slug: string): URLSearchParams {
	const params = new URLSearchParams();
	params.set('utm_campaign', 'seo-guide');
	params.set('utm_content', slug);
	return params;
}

export function guideRegisterUrl(slug: string, registerPath: string): string {
	return appendSearchParamsToAppPath(registerPath, guideCtaSearchParams(slug));
}
