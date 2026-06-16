import { appSettingsService } from '$lib/server/di';
import { billingActions } from '../billing.actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { user, householdId, planTier } = await parent();

	const checkout = url.searchParams.get('checkout');

	const [planLimits, billing, stripeCheckoutEnabled] = await Promise.all([
		user
			? locals.planLimitsService.getSnapshot({
					userId: user.id,
					householdId,
					tier: planTier
				})
			: Promise.resolve(null),
		householdId ? locals.billingService.getBillingState(householdId) : Promise.resolve(null),
		appSettingsService.isStripeCheckoutEnabled()
	]);

	return {
		planLimits,
		billing,
		stripeCheckoutEnabled,
		checkoutStatus:
			checkout === 'success'
				? ('success' as const)
				: checkout === 'cancel'
					? ('cancel' as const)
					: checkout === 'portal'
						? ('portal' as const)
						: null
	};
};

export const actions: Actions = {
	joinProWaitlist: billingActions.joinProWaitlist
};
