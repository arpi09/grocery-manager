import { describe, expect, it } from 'vitest';
import {
	planTierFromStripeSubscriptionStatus,
	resolvePlanTierFromBilling
} from '$lib/domain/billing';

describe('billing domain', () => {
	it('grants pro for active subscription status', () => {
		expect(planTierFromStripeSubscriptionStatus('active')).toBe('pro');
		expect(planTierFromStripeSubscriptionStatus('trialing')).toBe('pro');
	});

	it('denies pro for canceled subscription status', () => {
		expect(planTierFromStripeSubscriptionStatus('canceled')).toBe('free');
	});

	it('resolves pro when stored tier is pro and status is active', () => {
		expect(
			resolvePlanTierFromBilling({
				planTier: 'pro',
				stripeCustomerId: 'cus_1',
				stripeSubscriptionId: 'sub_1',
				stripeSubscriptionStatus: 'active'
			})
		).toBe('pro');
	});

	it('downgrades when stored tier is pro but subscription canceled', () => {
		expect(
			resolvePlanTierFromBilling({
				planTier: 'pro',
				stripeCustomerId: 'cus_1',
				stripeSubscriptionId: 'sub_1',
				stripeSubscriptionStatus: 'canceled'
			})
		).toBe('free');
	});
});
