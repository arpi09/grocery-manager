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
	buildFaqPageJsonLd,
	buildLandingJsonLd,
	buildMarketingWebPageJsonLd,
	buildSoftwareApplicationJsonLd,
	buildPricingJsonLd,
	buildRobotsTxt,
	buildSitemapXml,
	marketingOgImageUrl,
	OG_IMAGE_PATH,
	robotsDirectiveForPath,
	shouldIndexPath,
	SITEMAP_ENTRIES
} from './seo';
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

	it('includes all public marketing and auth paths', () => {
		const xml = buildSitemapXml('https://skaffu.com');
		for (const entry of SITEMAP_ENTRIES) {
			const loc = entry.path === '/' ? 'https://skaffu.com' : `https://skaffu.com${entry.path}`;
			expect(xml).toContain(`<loc>${loc}</loc>`);
		}
		expect(xml).toContain('<loc>https://skaffu.com/guider</loc>');
		expect(xml).not.toContain('/hem');
	});

	it('includes published guide slugs in sitemap', () => {
		const xml = buildSitemapXml('https://skaffu.com');
		expect(xml).toContain('<loc>https://skaffu.com/guider/minska-matsvinn-hemma-app</loc>');
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
	it('returns WebApplication and Organization schemas', () => {
		const schemas = buildLandingJsonLd('https://skaffu.com', 'Skafferi-app');
		expect(schemas).toHaveLength(2);
		expect(schemas[0]['@type']).toBe('WebApplication');
		expect(schemas[1]['@type']).toBe('Organization');
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
});

describe('marketing SEO keywords (sv)', () => {
	it('includes skafferi-app and minska matsvinn in primary meta and landing copy', () => {
		const content = getMarketingContent('sv');
		const haystack = [
			content.meta.title,
			content.meta.description,
			content.landing.wasteReductionTitle,
			content.landing.wasteReductionLead,
			content.faq.items[0]?.question ?? ''
		]
			.join(' ')
			.toLowerCase();

		expect(haystack).toContain('skafferi-app');
		expect(haystack).toContain('minska matsvinn');
	});
});
