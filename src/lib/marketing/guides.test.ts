import { describe, expect, it, vi } from 'vitest';
import { validateGuideQuality } from '$lib/marketing/guide-quality';
import {
	GUIDE_KEYWORD_MATRIX,
	guideCtaSearchParams,
	guideRegisterUrl,
	slugForGuideKeyword
} from '$lib/marketing/guides';
import {
	getLatestPublishedGuides,
	loadGuideBySlug,
	loadPublishedGuides,
	resolveNextGuideKeywordIndex
} from '$lib/marketing/guides.server';

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

describe('guide keyword queue', () => {
	it('slugForGuideKeyword matches expected slugs', () => {
		expect(slugForGuideKeyword('minska matsvinn hemma app')).toBe('minska-matsvinn-hemma-app');
		expect(slugForGuideKeyword('kvitto pdf till inköpslista')).toBe('kvitto-pdf-till-inkopslista');
	});

	it('resolveNextGuideKeywordIndex skips existing guide files', () => {
		const index = resolveNextGuideKeywordIndex();
		expect(index).not.toBe(0);
		if (index !== null) {
			const slug = slugForGuideKeyword(GUIDE_KEYWORD_MATRIX[index].primaryKeyword);
			expect(loadGuideBySlug(slug)).toBeNull();
		}
	});

	it('resolveNextGuideKeywordIndex returns null when all matrix slugs exist', async () => {
		const slugs = GUIDE_KEYWORD_MATRIX.map((row) => slugForGuideKeyword(row.primaryKeyword));

		vi.doMock('node:fs', async (importOriginal) => {
			const actual = await importOriginal<typeof import('node:fs')>();
			return {
				...actual,
				existsSync: (path: Parameters<typeof actual.existsSync>[0]) => {
					const normalized = String(path).replace(/\\/g, '/');
					if (slugs.some((slug) => normalized.endsWith(`content/guides/sv/${slug}.md`))) {
						return true;
					}
					return actual.existsSync(path);
				}
			};
		});

		vi.resetModules();
		const { resolveNextGuideKeywordIndex: resolveEmptyQueue } = await import(
			'$lib/marketing/guides.server'
		);
		expect(resolveEmptyQueue()).toBeNull();
		vi.doUnmock('node:fs');
		vi.resetModules();
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
