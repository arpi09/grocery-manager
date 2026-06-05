import { marketingCanonicalUrl, resolveAppOrigin } from '$lib/marketing/app-url';
import { isMarketingPath } from '$lib/marketing/routes';

export const SITE_NAME = 'Skaffu';

/** Default Open Graph / Twitter image (absolute URL built at render time). PNG for LinkedIn/social crawlers. */
export const OG_IMAGE_PATH = '/og-skaffu.png';

/**
 * Bump when replacing static/og-skaffu.png so LinkedIn/Twitter refetch cached previews.
 * LinkedIn does not render SVG og:image — v2 switched from og-skaffu.svg to PNG (PR #7).
 */
export const OG_IMAGE_VERSION = '2';

/** LinkedIn / OG recommended dimensions (matches static/og-skaffu.png). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export interface SitemapEntry {
	path: string;
	changefreq: 'weekly' | 'monthly';
	priority: number;
}

/** Public indexable paths included in sitemap.xml. */
export const SITEMAP_ENTRIES: SitemapEntry[] = [
	{ path: '/', changefreq: 'weekly', priority: 1 },
	{ path: '/funktioner', changefreq: 'monthly', priority: 0.9 },
	{ path: '/sa-fungerar-det', changefreq: 'monthly', priority: 0.8 },
	{ path: '/faq', changefreq: 'monthly', priority: 0.7 },
	{ path: '/priser', changefreq: 'monthly', priority: 0.7 },
	{ path: '/privacy', changefreq: 'monthly', priority: 0.5 },
	{ path: '/login', changefreq: 'monthly', priority: 0.6 },
	{ path: '/register', changefreq: 'monthly', priority: 0.6 }
];

/** App and API paths that should not be crawled. */
export const ROBOTS_DISALLOW_PREFIXES = [
	'/admin',
	'/api/',
	'/hem',
	'/settings',
	'/profile',
	'/inventory',
	'/inkop',
	'/planer',
	'/statistik',
	'/scan',
	'/item',
	'/husdjur',
	'/invite',
	'/install-app',
	'/nyheter',
	'/news',
	'/logout'
] as const;

export function marketingOgImageUrl(requestOrigin?: string): string {
	const origin = resolveAppOrigin(requestOrigin);
	return `${origin}${OG_IMAGE_PATH}?v=${OG_IMAGE_VERSION}`;
}

export function sitemapAbsoluteUrl(path: string, requestOrigin?: string): string {
	return marketingCanonicalUrl(path, requestOrigin);
}

export function buildSitemapXml(requestOrigin?: string): string {
	const origin = resolveAppOrigin(requestOrigin);
	const lastmod = new Date().toISOString().slice(0, 10);
	const urls = SITEMAP_ENTRIES.map(
		(entry) => `  <url>
    <loc>${sitemapAbsoluteUrl(entry.path, origin)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
	).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function buildRobotsTxt(requestOrigin?: string): string {
	const sitemapUrl = `${resolveAppOrigin(requestOrigin)}/sitemap.xml`;
	const disallow = ROBOTS_DISALLOW_PREFIXES.map((path) => `Disallow: ${path}`).join('\n');

	return `User-agent: *
Allow: /
${disallow}

Sitemap: ${sitemapUrl}
`;
}

export interface WebApplicationJsonLd {
	name: string;
	url: string;
	description: string;
	applicationCategory: string;
	operatingSystem: string;
	offers: {
		'@type': 'Offer';
		price: string;
		priceCurrency: string;
	};
}

export interface OrganizationJsonLd {
	name: string;
	url: string;
	logo: string;
	email: string;
	description: string;
}

export function buildLandingJsonLd(
	origin: string,
	description: string
): Record<string, unknown>[] {
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: SITE_NAME,
			url: origin,
			description,
			applicationCategory: 'LifestyleApplication',
			operatingSystem: 'Web',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'SEK'
			}
		},
		{
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: SITE_NAME,
			url: origin,
			logo: marketingOgImageUrl(origin),
			email: 'hello@skaffu.com',
			description
		}
	];
}

export interface FaqJsonLdItem {
	question: string;
	answer: string;
}

export function buildFaqPageJsonLd(
	canonicalUrl: string,
	items: FaqJsonLdItem[]
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	};
}

export function buildMarketingWebPageJsonLd(
	siteOrigin: string,
	path: string,
	name: string,
	description: string
): Record<string, unknown> {
	const pageUrl = marketingCanonicalUrl(path, siteOrigin);
	return {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name,
		description,
		url: pageUrl,
		isPartOf: {
			'@type': 'WebSite',
			name: SITE_NAME,
			url: marketingCanonicalUrl('/', siteOrigin)
		}
	};
}

export function buildPricingJsonLd(
	siteOrigin: string,
	options: {
		freeDescription: string;
		proDescription: string;
		proMonthlyPrice: number;
		proYearlyPrice: number;
	}
): Record<string, unknown>[] {
	const pricingUrl = marketingCanonicalUrl('/priser', siteOrigin);
	return [
		buildMarketingWebPageJsonLd(siteOrigin, '/priser', 'Priser & planer', options.freeDescription),
		{
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: `${SITE_NAME} Pro`,
			description: options.proDescription,
			brand: { '@type': 'Brand', name: SITE_NAME },
			url: pricingUrl,
			offers: [
				{
					'@type': 'Offer',
					name: 'Gratis',
					price: '0',
					priceCurrency: 'SEK',
					url: pricingUrl,
					availability: 'https://schema.org/InStock'
				},
				{
					'@type': 'Offer',
					name: 'Pro månadsvis',
					price: String(options.proMonthlyPrice),
					priceCurrency: 'SEK',
					url: pricingUrl,
					availability: 'https://schema.org/InStock'
				},
				{
					'@type': 'Offer',
					name: 'Pro årsvis',
					price: String(options.proYearlyPrice),
					priceCurrency: 'SEK',
					url: pricingUrl,
					availability: 'https://schema.org/InStock'
				}
			]
		}
	];
}

const AUTH_INDEX_PATHS = new Set(['/login', '/register']);

/** Whether crawlers should index this pathname. */
export function shouldIndexPath(pathname: string): boolean {
	if (isMarketingPath(pathname) || AUTH_INDEX_PATHS.has(pathname)) {
		return true;
	}
	return false;
}

export function robotsDirectiveForPath(pathname: string): string {
	return shouldIndexPath(pathname) ? 'index, follow' : 'noindex, nofollow';
}
