import { DEFAULT_PLAN_TIER, type PlanTier } from '$lib/domain/plan';

export type BillingInterval = 'month' | 'year';

/** Stripe subscription statuses that grant Pro access. */
const PRO_GRANTING_STATUSES = new Set([
	'active',
	'trialing',
	'past_due'
]);

export interface HouseholdBillingState {
	planTier: PlanTier;
	stripeCustomerId: string | null;
	stripeSubscriptionId: string | null;
	stripeSubscriptionStatus: string | null;
}

export function resolvePlanTierFromBilling(state: HouseholdBillingState): PlanTier {
	if (state.planTier === 'pro') {
		if (!state.stripeSubscriptionStatus) {
			return 'pro';
		}
		return PRO_GRANTING_STATUSES.has(state.stripeSubscriptionStatus) ? 'pro' : 'free';
	}
	return DEFAULT_PLAN_TIER;
}

export function planTierFromStripeSubscriptionStatus(status: string | null | undefined): PlanTier {
	if (status && PRO_GRANTING_STATUSES.has(status)) {
		return 'pro';
	}
	return 'free';
}
