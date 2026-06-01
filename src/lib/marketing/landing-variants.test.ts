import { describe, expect, it } from 'vitest';
import { getLandingHeroCopy, resolveLandingVariant } from '$lib/marketing/landing-variants';

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

describe('getLandingHeroCopy', () => {
	it('returns distinct copy for a and b', () => {
		const a = getLandingHeroCopy('a', 'sv');
		const b = getLandingHeroCopy('b', 'sv');
		expect(a.heroTitle).not.toBe(b.heroTitle);
		expect(b.heroTitle).toContain('Butiksneutralt');
	});
});
