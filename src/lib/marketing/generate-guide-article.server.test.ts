import { describe, expect, it } from 'vitest';
import { buildLinkedInPostBody } from '$lib/marketing/generate-guide-article.server';

describe('buildLinkedInPostBody', () => {
	it('builds deterministic teaser from title and description', () => {
		const body = buildLinkedInPostBody('Så minskar du matsvinn', 'Kort ingress om skafferi.');
		expect(body).toContain('Så minskar du matsvinn');
		expect(body).toContain('Kort ingress om skafferi.');
		expect(body).toContain('skaffu.com');
	});
});
