import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PLAN_TIER,
	FREE_LIMITS,
	getAiLimit,
	getNearbyRadiusM,
	isProTier,
	PRICE_HYPOTHESIS_SEK,
	resolveEffectivePlanTier,
	STRIPE_READINESS_GATES
} from './plan';

describe('plan', () => {
	it('defaults to free tier', () => {
		expect(DEFAULT_PLAN_TIER).toBe('free');
		expect(isProTier('free')).toBe(false);
		expect(isProTier('pro')).toBe(true);
	});

	it('keeps free limits concrete for future enforcement', () => {
		expect(FREE_LIMITS.maxInventoryItems).toBe(400);
		expect(FREE_LIMITS.maxHouseholdMembers).toBe(4);
		expect(FREE_LIMITS.aiScansPerMonth).toBe(75);
		expect(FREE_LIMITS.receiptPdfParsesPerMonth).toBe(25);
		expect(FREE_LIMITS.smartFillPerWeek).toBe(8);
		expect(FREE_LIMITS.adminInsightsPerWeek).toBe(40);
		expect(getAiLimit('free', 'ai_scan')).toBe(FREE_LIMITS.aiScansPerMonth);
		expect(getAiLimit('pro', 'ai_scan')).toBeNull();
	});

	it('returns nearby radius by tier', () => {
		expect(getNearbyRadiusM('free')).toBe(500);
		expect(getNearbyRadiusM('pro')).toBe(2000);
	});

	it('treats app admins as Pro for enforcement', () => {
		expect(resolveEffectivePlanTier({ role: 'admin' }, 'free')).toBe('pro');
		expect(resolveEffectivePlanTier({ role: 'user' }, 'free')).toBe('free');
		expect(resolveEffectivePlanTier({ role: 'user' }, 'pro')).toBe('pro');
		expect(resolveEffectivePlanTier(null, 'free')).toBe('free');
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
