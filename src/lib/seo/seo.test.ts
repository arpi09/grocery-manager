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
	buildLandingJsonLd,
	buildRobotsTxt,
	buildSitemapXml,
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
		expect(xml).not.toContain('/hem');
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
