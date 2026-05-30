import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PLAN_TIER,
	FREE_LIMITS,
	getAiLimit,
	isProTier,
	PRICE_HYPOTHESIS_SEK,
	STRIPE_READINESS_GATES
} from './plan';

describe('plan', () => {
	it('defaults to free tier', () => {
		expect(DEFAULT_PLAN_TIER).toBe('free');
		expect(isProTier('free')).toBe(false);
		expect(isProTier('pro')).toBe(true);
	});

	it('keeps free limits concrete for future enforcement', () => {
		expect(FREE_LIMITS.maxInventoryItems).toBeGreaterThan(0);
		expect(FREE_LIMITS.maxHouseholdMembers).toBe(2);
		expect(FREE_LIMITS.aiScansPerMonth).toBeGreaterThan(0);
		expect(getAiLimit('free', 'ai_scan')).toBe(FREE_LIMITS.aiScansPerMonth);
		expect(getAiLimit('pro', 'ai_scan')).toBeNull();
	});

	it('anchors price hypothesis within competitor band', () => {
		expect(PRICE_HYPOTHESIS_SEK.monthly).toBeGreaterThanOrEqual(
			PRICE_HYPOTHESIS_SEK.competitorMonthlyLow
		);
		expect(PRICE_HYPOTHESIS_SEK.monthly).toBeLessThanOrEqual(
			PRICE_HYPOTHESIS_SEK.competitorMonthlyHigh
		);
	});

	it('requires retention and waitlist before Stripe', () => {
		expect(STRIPE_READINESS_GATES.payingWaitlistMin).toBeGreaterThan(0);
		expect(STRIPE_READINESS_GATES.d30RetentionMin).toBeLessThan(
			STRIPE_READINESS_GATES.d30RetentionTarget
		);
	});
});
