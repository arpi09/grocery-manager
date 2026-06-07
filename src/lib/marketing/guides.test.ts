import { describe, expect, it } from 'vitest';
import { validateGuideQuality } from '$lib/marketing/guide-quality';
import {
	getLatestPublishedGuides,
	guideCtaSearchParams,
	guideRegisterUrl,
	loadGuideBySlug,
	loadPublishedGuides
} from '$lib/marketing/guides';

describe('guides content', () => {
	it('loads at least one published guide from content/guides/sv', () => {
		const guides = loadPublishedGuides();
		expect(guides.length).toBeGreaterThanOrEqual(1);
	});

	it('returns null for unknown slug', () => {
		expect(loadGuideBySlug('does-not-exist-xyz')).toBeNull();
	});

	it('lists latest published guides sorted by date desc', () => {
		const latest = getLatestPublishedGuides(3);
		expect(latest.length).toBeGreaterThanOrEqual(1);
		for (let i = 1; i < latest.length; i++) {
			expect(latest[i - 1].date >= latest[i].date).toBe(true);
		}
	});

	it('builds guide CTA UTM params', () => {
		const params = guideCtaSearchParams('test-slug');
		expect(params.get('utm_campaign')).toBe('seo-guide');
		expect(params.get('utm_content')).toBe('test-slug');
		expect(guideRegisterUrl('test-slug', '/register')).toBe(
			'/register?utm_campaign=seo-guide&utm_content=test-slug'
		);
	});
});

describe('published guide quality', () => {
	it('passes checklist for each published guide', () => {
		for (const guide of loadPublishedGuides()) {
			const result = validateGuideQuality({
				title: guide.title,
				description: guide.description,
				body: guide.body
			});
			expect(result.ok, `${guide.slug}: ${result.errors.join('; ')}`).toBe(true);
		}
	});
});
