import { describe, expect, it } from 'vitest';
import {
	landingRegisterClickRate,
	landingSignupRate,
	summarizeLandingVariantFunnel
} from '$lib/domain/landing-analytics';

describe('summarizeLandingVariantFunnel', () => {
	it('aggregates views, clicks and signups per variant', () => {
		const summary = summarizeLandingVariantFunnel([
			{ eventType: 'landing_view', metadata: JSON.stringify({ variant: 'a' }) },
			{ eventType: 'landing_view', metadata: JSON.stringify({ variant: 'a' }) },
			{ eventType: 'register_click', metadata: JSON.stringify({ variant: 'a' }) },
			{ eventType: 'landing_view', metadata: JSON.stringify({ variant: 'b' }) },
			{ eventType: 'signup_complete', metadata: JSON.stringify({ variant: 'b' }) }
		]);

		expect(summary.a).toEqual({ views: 2, registerClicks: 1, signups: 0 });
		expect(summary.b).toEqual({ views: 1, registerClicks: 0, signups: 1 });
		expect(landingRegisterClickRate(summary.a)).toBe(0.5);
		expect(landingSignupRate(summary.b)).toBe(1);
	});

	it('ignores rows without a valid variant', () => {
		const summary = summarizeLandingVariantFunnel([
			{ eventType: 'landing_view', metadata: null },
			{ eventType: 'landing_view', metadata: JSON.stringify({ variant: 'x' }) }
		]);

		expect(summary.a.views).toBe(0);
		expect(summary.b.views).toBe(0);
	});
});

describe('landing conversion rates', () => {
	it('returns null when there are no views', () => {
		expect(landingRegisterClickRate({ views: 0, registerClicks: 0, signups: 0 })).toBeNull();
		expect(landingSignupRate({ views: 0, registerClicks: 0, signups: 0 })).toBeNull();
	});
});
