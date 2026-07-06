import { describe, expect, it } from 'vitest';
import {
	getStoreGuide,
	getStoreGuideSitemapEntries,
	getStoreGuideSlugs,
	STORE_GUIDES
} from './store-guides';

describe('store-guides', () => {
	it('resolves a known store and 404s an unknown one', () => {
		expect(getStoreGuide('ica')?.storeName).toBe('ICA');
		expect(getStoreGuide('nonexistent')).toBeNull();
	});

	it('exposes every store slug for routing/sitemap', () => {
		expect(getStoreGuideSlugs()).toEqual(STORE_GUIDES.map((g) => g.slug));
		expect(getStoreGuideSlugs().length).toBeGreaterThanOrEqual(4);
	});

	it('each store page carries genuine differentiated content (not thin)', () => {
		for (const guide of STORE_GUIDES) {
			expect(guide.h1).toContain(guide.storeName);
			expect(guide.points.length).toBeGreaterThanOrEqual(3);
			expect(guide.steps.length).toBeGreaterThanOrEqual(3);
			expect(guide.faq.length).toBeGreaterThanOrEqual(3);
			expect(guide.meta.description.length).toBeGreaterThan(80);
			// Store name appears in the FAQ — content is store-specific, not templated-generic.
			expect(guide.faq.some((f) => f.question.includes(guide.storeName))).toBe(true);
		}
	});

	it('produces sitemap entries under /kvitto/[slug] with a stable lastmod', () => {
		const entries = getStoreGuideSitemapEntries();
		expect(entries).toHaveLength(STORE_GUIDES.length);
		expect(entries[0].path).toMatch(/^\/kvitto\//);
		expect(entries[0].lastmod).toBeTruthy();
	});
});
