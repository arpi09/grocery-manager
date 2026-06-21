import { describe, expect, it } from 'vitest';
import {
	getLandingHeroCopy,
	getReceiptHeroCopy,
	resolveLandingVariant,
	resolveReceiptHeroVariant
} from '$lib/marketing/landing-variants';

describe('resolveLandingVariant', () => {
	it('prefers query over cookie and env', () => {
		expect(
			resolveLandingVariant({
				queryHero: 'b',
				cookieVariant: 'a',
				envVariant: 'a'
			})
		).toBe('b');
	});

	it('falls back to cookie then env', () => {
		expect(resolveLandingVariant({ cookieVariant: 'b', envVariant: 'a' })).toBe('b');
		expect(resolveLandingVariant({ envVariant: 'b' })).toBe('b');
	});

	it('defaults to a for unknown values', () => {
		expect(resolveLandingVariant({ queryHero: 'x', cookieVariant: 'z' })).toBe('a');
	});

	it('skips cookie when allowVariantCookie is false', () => {
		expect(
			resolveLandingVariant({ cookieVariant: 'b', allowVariantCookie: false, envVariant: 'a' })
		).toBe('a');
	});
});

describe('resolveReceiptHeroVariant', () => {
	it('prefers query over cookie', () => {
		expect(
			resolveReceiptHeroVariant({
				queryReceiptHero: 'c',
				cookieVariant: 'a'
			})
		).toBe('c');
	});

	it('defaults to a for unknown values', () => {
		expect(resolveReceiptHeroVariant({ queryReceiptHero: 'x' })).toBe('a');
	});
});

describe('getLandingHeroCopy', () => {
	it('returns distinct copy for a and b', () => {
		const a = getLandingHeroCopy('a', 'sv');
		const b = getLandingHeroCopy('b', 'sv');
		expect(a.heroTitle).not.toBe(b.heroTitle);
		expect(a.heroTitle).toContain('Skaffu');
		expect(b.heroTitle).toContain('Butiksneutralt');
	});

	it('uses Skaffu product framing for variant a secondary', () => {
		const a = getLandingHeroCopy('a', 'sv');
		expect(a.heroSecondary).toContain('Skaffu föresl');
		expect(a.heroSecondary.toLowerCase()).not.toContain('autopilot');
	});

	it('does not promise Kivra integration in variant b secondary', () => {
		const b = getLandingHeroCopy('b', 'sv');
		expect(b.heroSecondary.toLowerCase()).not.toContain('från kivra');
		expect(b.heroSecondary.toLowerCase()).not.toContain('autopilot');
	});
});

describe('getReceiptHeroCopy', () => {
	it('returns distinct copy for receipt hero variants', () => {
		const a = getReceiptHeroCopy('a', 'sv');
		const b = getReceiptHeroCopy('b', 'sv');
		const c = getReceiptHeroCopy('c', 'sv');
		expect(a.heroTitle).not.toBe(b.heroTitle);
		expect(b.heroTitle).not.toBe(c.heroTitle);
		expect(a.heroTitle).toContain('digitalt kvitto');
	});

	it('avoids autopilot jargon in receipt hero copy', () => {
		for (const variant of ['a', 'b', 'c'] as const) {
			const copy = getReceiptHeroCopy(variant, 'sv');
			expect(copy.heroSecondary.toLowerCase()).not.toContain('autopilot');
		}
	});
});
