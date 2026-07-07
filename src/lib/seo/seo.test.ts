import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPublicEnv } = vi.hoisted(() => ({
	mockPublicEnv: {
		PUBLIC_APP_URL: undefined as string | undefined,
		PUBLIC_ORIGIN: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: mockPublicEnv
}));

import {
	buildArticleJsonLd,
	buildBreadcrumbJsonLd,
	buildFaqPageJsonLd,
	buildLandingJsonLd,
	buildMarketingWebPageJsonLd,
	buildSoftwareApplicationJsonLd,
	buildPricingJsonLd,
	buildRobotsTxt,
	marketingLogoUrl,
	marketingOgImageUrl,
	OG_IMAGE_PATH,
	SEO_LOGO_PATH,
	robotsDirectiveForPath,
	shouldIndexPath,
	MARKETING_CONTENT_LASTMOD,
	SITEMAP_ENTRIES
} from './seo';
import { buildSitemapXml } from './seo.server';
import { getMarketingContent } from '$lib/marketing/content';

describe('shouldIndexPath', () => {
	it('indexes marketing and auth paths', () => {
		expect(shouldIndexPath('/')).toBe(true);
		expect(shouldIndexPath('/faq')).toBe(true);
		expect(shouldIndexPath('/login')).toBe(true);
		expect(shouldIndexPath('/register')).toBe(true);
	});

	it('does not index private app paths', () => {
		expect(shouldIndexPath('/hem')).toBe(false);
		expect(shouldIndexPath('/admin')).toBe(false);
		expect(shouldIndexPath('/inventory/fridge')).toBe(false);
	});
});

describe('robotsDirectiveForPath', () => {
	it('returns noindex for app shell routes', () => {
		expect(robotsDirectiveForPath('/hem')).toBe('noindex, nofollow');
	});

	it('returns index for login', () => {
		expect(robotsDirectiveForPath('/login')).toBe('index, follow');
	});
});

describe('buildSitemapXml', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_ORIGIN = 'https://skaffu.com';
	});

	it('includes all public marketing and auth paths', async () => {
		const xml = await buildSitemapXml('https://skaffu.com');
		for (const entry of SITEMAP_ENTRIES) {
			const loc = entry.path === '/' ? 'https://skaffu.com' : `https://skaffu.com${entry.path}`;
			expect(xml).toContain(`<loc>${loc}</loc>`);
		}
		expect(xml).toContain('<loc>https://skaffu.com/guider</loc>');
		/* Private app route must not be crawled — assert the exact URL, not a loose substring
		   (the /kvitto/hemkop store page legitimately contains "/hem"). */
		expect(xml).not.toContain('<loc>https://skaffu.com/hem</loc>');
	});

	it('includes programmatic store pages', async () => {
		const xml = await buildSitemapXml('https://skaffu.com');
		expect(xml).toContain('<loc>https://skaffu.com/kvitto/ica</loc>');
		expect(xml).toContain('<loc>https://skaffu.com/kvitto/hemkop</loc>');
	});

	it('includes published guide slugs in sitemap', async () => {
		const xml = await buildSitemapXml('https://skaffu.com');
		expect(xml).toContain('<loc>https://skaffu.com/guider/minska-matsvinn-hemma-app</loc>');
	});

	it('uses a stable content lastmod for static pages, not today', async () => {
		const xml = await buildSitemapXml('https://skaffu.com');
		/* Static marketing pages carry the truthful content date — never "now" on every crawl. */
		expect(xml).toContain(`<lastmod>${MARKETING_CONTENT_LASTMOD}</lastmod>`);
		const today = new Date().toISOString().slice(0, 10);
		if (today !== MARKETING_CONTENT_LASTMOD) {
			/* Guarantees we stopped stamping every URL with the crawl date. */
			const staticBlock = xml.split('/guider/')[0];
			expect(staticBlock).not.toContain(`<lastmod>${today}</lastmod>`);
		}
	});
});

describe('buildBreadcrumbJsonLd', () => {
	it('builds an ordered BreadcrumbList with absolute item URLs', () => {
		const json = buildBreadcrumbJsonLd('https://skaffu.com', [
			{ name: 'Skaffu', path: '/' },
			{ name: 'Guider', path: '/guider' },
			{ name: 'Minska matsvinn', path: '/guider/minska-matsvinn' }
		]);
		expect(json['@type']).toBe('BreadcrumbList');
		const items = json.itemListElement as Array<Record<string, unknown>>;
		expect(items).toHaveLength(3);
		expect(items[0]).toMatchObject({ position: 1, name: 'Skaffu', item: 'https://skaffu.com' });
		expect(items[2]).toMatchObject({
			position: 3,
			name: 'Minska matsvinn',
			item: 'https://skaffu.com/guider/minska-matsvinn'
		});
	});
});

describe('marketingOgImageUrl', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_ORIGIN = 'https://skaffu.com';
	});

	it('returns absolute HTTPS PNG path with cache-bust version for social crawlers', () => {
		expect(OG_IMAGE_PATH).toBe('/og-skaffu.png');
		expect(marketingOgImageUrl('https://skaffu.com')).toBe(
			'https://skaffu.com/og-skaffu.png?v=2'
		);
	});
});

describe('marketingLogoUrl', () => {
	it('returns the square PWA icon — Google requires ≥112×112 square for brand logo', () => {
		expect(SEO_LOGO_PATH).toBe('/pwa/icon-512.png');
		expect(marketingLogoUrl('https://skaffu.com')).toBe('https://skaffu.com/pwa/icon-512.png');
	});
});

describe('buildRobotsTxt', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_ORIGIN = 'https://skaffu.com';
	});

	it('disallows private routes and references sitemap', () => {
		const txt = buildRobotsTxt('https://skaffu.com');
		expect(txt).toContain('Disallow: /hem');
		expect(txt).toContain('Disallow: /api/');
		expect(txt).toContain('Sitemap: https://skaffu.com/sitemap.xml');
	});
});

describe('buildLandingJsonLd', () => {
	it('returns WebApplication, Organization and WebSite schemas', () => {
		const schemas = buildLandingJsonLd('https://skaffu.com', 'Skafferi-app');
		expect(schemas).toHaveLength(3);
		expect(schemas[0]['@type']).toBe('WebApplication');
		expect(schemas[1]['@type']).toBe('Organization');
		expect(schemas[2]['@type']).toBe('WebSite');
	});

	it('includes Organization sameAs and alternateName for brand entity', () => {
		const schemas = buildLandingJsonLd('https://skaffu.com', 'Skafferi-app');
		const org = schemas[1] as Record<string, unknown>;
		expect(org.sameAs).toEqual([
			'https://www.linkedin.com/company/skaffu',
			'https://www.facebook.com/profile.php?id=100066978903320'
		]);
		expect(org.alternateName).toEqual(['Skaffu app', 'Skafferi-app']);
	});

	it('uses the square logo for Organization, not the 1200×630 OG image', () => {
		const schemas = buildLandingJsonLd('https://skaffu.com', 'Skafferi-app');
		const org = schemas[1] as Record<string, unknown>;
		expect(org.logo).toBe('https://skaffu.com/pwa/icon-512.png');
	});

	it('gives WebSite an alternateName so Google shows "Skaffu" as site name', () => {
		const schemas = buildLandingJsonLd('https://skaffu.com', 'Skafferi-app');
		const site = schemas[2] as Record<string, unknown>;
		expect(site.alternateName).toEqual(['skaffu.com', 'Skaffu app']);
	});
});

describe('buildFaqPageJsonLd', () => {
	it('maps FAQ items to FAQPage schema', () => {
		const schema = buildFaqPageJsonLd('https://skaffu.com/faq', [
			{ question: 'Kostar det?', answer: 'Gratis att börja.' }
		]);
		expect(schema['@type']).toBe('FAQPage');
		expect(schema.mainEntity).toHaveLength(1);
		expect((schema.mainEntity as { name: string }[])[0].name).toBe('Kostar det?');
	});
});

describe('buildSoftwareApplicationJsonLd', () => {
	it('returns SoftwareApplication schema for SEO landing pages', () => {
		const schema = buildSoftwareApplicationJsonLd(
			'https://skaffu.com',
			'/skafferi-app',
			'Skafferi-app med lager'
		);
		expect(schema['@type']).toBe('SoftwareApplication');
		expect(schema.url).toBe('https://skaffu.com/skafferi-app');
	});
});

describe('buildArticleJsonLd', () => {
	it('returns Article schema for guide pages', () => {
		const schema = buildArticleJsonLd('https://skaffu.com', {
			slug: 'test-guide',
			title: 'Test guide',
			description: 'Beskrivning',
			date: '2026-06-01',
			keywords: ['skafferi', 'matsvinn']
		});
		expect(schema['@type']).toBe('Article');
		expect(schema.url).toBe('https://skaffu.com/guider/test-guide');
	});

	it('uses the square logo for publisher.logo', () => {
		const schema = buildArticleJsonLd('https://skaffu.com', {
			slug: 'test-guide',
			title: 'Test guide',
			description: 'Beskrivning',
			date: '2026-06-01',
			keywords: ['skafferi']
		});
		const publisher = schema.publisher as { logo: { url: string } };
		expect(publisher.logo.url).toBe('https://skaffu.com/pwa/icon-512.png');
	});
});

describe('buildMarketingWebPageJsonLd', () => {
	it('links page to site origin', () => {
		const schema = buildMarketingWebPageJsonLd(
			'https://skaffu.com',
			'/funktioner',
			'Funktioner',
			'Beskrivning'
		);
		expect(schema['@type']).toBe('WebPage');
		expect(schema.url).toBe('https://skaffu.com/funktioner');
		expect((schema.isPartOf as { url: string }).url).toBe('https://skaffu.com');
	});
});

describe('buildPricingJsonLd', () => {
	it('returns WebPage and Product offers', () => {
		const schemas = buildPricingJsonLd('https://skaffu.com', {
			freeDescription: 'Gratisplan',
			proDescription: 'Pro med AI',
			proMonthlyPrice: 39,
			proYearlyPrice: 390
		});
		expect(schemas).toHaveLength(2);
		expect(schemas[1]['@type']).toBe('Product');
		expect((schemas[1].offers as unknown[]).length).toBe(3);
	});

	it('marks Pro offers as PreOrder when checkout is disabled', () => {
		const schemas = buildPricingJsonLd('https://skaffu.com', {
			freeDescription: 'Gratisplan',
			proDescription: 'Pro med AI',
			proMonthlyPrice: 39,
			proYearlyPrice: 390,
			proCheckoutEnabled: false
		});
		const offers = schemas[1].offers as Array<{ availability: string }>;
		expect(offers[0].availability).toBe('https://schema.org/InStock');
		expect(offers[1].availability).toBe('https://schema.org/PreOrder');
		expect(offers[2].availability).toBe('https://schema.org/PreOrder');
	});
});

describe('marketing SEO keywords (sv)', () => {
	it('includes skafferi-app and minska matsvinn in primary meta and landing copy', () => {
		const content = getMarketingContent('sv');
		const haystack = [
			content.meta.title,
			content.meta.description,
			content.landing.wasteReductionTitle,
			content.landing.wasteReductionLead,
			content.faq.items[0]?.question ?? '',
			content.faq.items[0]?.answer ?? ''
		]
			.join(' ')
			.toLowerCase();

		expect(haystack).toContain('skafferi-app');
		expect(haystack).toContain('minska matsvinn');
	});
});
