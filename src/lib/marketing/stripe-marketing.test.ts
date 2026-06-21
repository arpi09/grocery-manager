import { describe, expect, it } from 'vitest';
import { getMarketingContent } from '$lib/marketing/content';
import { getPricingContent } from '$lib/marketing/pricing-content';

describe('getMarketingContent stripe checkout mode', () => {
	it('uses live Pro copy when checkout is enabled', () => {
		const content = getMarketingContent('sv', true);
		expect(content.proLaunch.badge).toBe('Pro är live');
		expect(content.faq.items.find((item) => item.question === 'Kostar Skaffu något?')?.answer).toContain(
			'uppgradera under Inställningar'
		);
	});

	it('uses coming-soon Pro copy when checkout is disabled', () => {
		const content = getMarketingContent('sv', false);
		expect(content.proLaunch.badge).toBe('Pro på väg');
		expect(content.proLaunch.priceFrom).toContain('planeras');
		expect(content.faq.items.find((item) => item.question === 'Kostar Skaffu något?')?.answer).toContain(
			'betalning aktiveras senare'
		);
	});

	it('uses English coming-soon copy when checkout is disabled', () => {
		const content = getMarketingContent('en', false);
		expect(content.proLaunch.badge).toBe('Pro coming soon');
		expect(content.faq.items.find((item) => item.question === 'Does Skaffu cost anything?')?.answer).toContain(
			'billing is not enabled yet'
		);
	});
});

describe('getPricingContent stripe checkout mode', () => {
	it('marks checkout enabled and shows upgrade CTA when live', () => {
		const pricing = getPricingContent('sv', true);
		expect(pricing.checkoutEnabled).toBe(true);
		expect(pricing.proStatusNote).toContain('Pro är live');
		expect(pricing.proCtaUpgradeLabel).toContain('uppgradera');
	});

	it('marks checkout disabled and hides upgrade promises when off', () => {
		const pricing = getPricingContent('sv', false);
		expect(pricing.checkoutEnabled).toBe(false);
		expect(pricing.proStatusNote).toContain('på väg');
		expect(pricing.proCtaTitle).toBe('Pro kommer snart');
		expect(pricing.stripeNoteBody).toContain('aktiveras när Pro lanseras');
	});
});
