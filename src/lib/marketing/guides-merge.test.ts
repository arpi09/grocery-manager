import { describe, expect, it } from 'vitest';
import type { Guide } from '$lib/marketing/guides';
import { mergeGuides } from '$lib/marketing/guides.server';

function makeGuide(slug: string, overrides: Partial<Guide> = {}): Guide {
	return {
		slug,
		title: `Title ${slug}`,
		description: 'Description text',
		date: '2026-06-01',
		keywords: [],
		published: true,
		body: 'Body',
		html: '<p>Body</p>',
		wordCount: 1,
		...overrides
	};
}

describe('mergeGuides', () => {
	it('merges file and DB guides sorted by date desc', () => {
		const merged = mergeGuides(
			[makeGuide('older', { date: '2026-05-01' })],
			[makeGuide('newer', { date: '2026-06-15' })]
		);
		expect(merged.map((g) => g.slug)).toEqual(['newer', 'older']);
	});

	it('prefers DB guide when slug conflicts', () => {
		const merged = mergeGuides(
			[makeGuide('shared', { title: 'From file' })],
			[makeGuide('shared', { title: 'From DB' })]
		);
		expect(merged).toHaveLength(1);
		expect(merged[0].title).toBe('From DB');
	});

	it('includes unpublished file guides in merge output', () => {
		const merged = mergeGuides(
			[makeGuide('draft-only', { published: false })],
			[makeGuide('published-db', { date: '2026-06-10' })]
		);
		expect(merged.map((g) => g.slug)).toContain('draft-only');
	});
});
