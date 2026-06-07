import { canEditInventory, isHouseholdOwner } from '$lib/domain/household';
import { DEFAULT_PLAN_TIER, isProTier } from '$lib/domain/plan';
import { isStripeCheckoutConfigured } from '$lib/server/stripe';
import {
	expiryReminderService,
	pushSubscriptionRepository,
	receiptForwardService,
	shoppingPushService
} from '$lib/server/di';
import { buildKivraForwardAddress, isKivraForwardEnabled } from '$lib/server/kivra-forward';
import { billingActions } from './billing.actions';
import { householdActions } from './household.actions';
import { notificationsActions } from './notifications.actions';
import { petsActions } from './pets.actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { user } = await parent();
	const householdId = locals.householdId;
	const householdRole = locals.householdRole;
	const isOwner = householdRole ? isHouseholdOwner(householdRole) : false;
	const planTier = locals.planTier ?? DEFAULT_PLAN_TIER;

	const [
		pets,
		household,
		pendingInvites,
		expirySettings,
		shoppingPushSettings,
		autoExpiredGraceDays,
		planLimits,
		billing,
		pushNotificationsEnabled
	] = await Promise.all([
		user ? locals.petService.listPets(user.id) : Promise.resolve([]),
		user ? locals.householdService.getHouseholdForUser(user.id) : Promise.resolve(null),
		user && householdId && isOwner
			? locals.householdService.listPendingInvites(householdId, user.id)
			: Promise.resolve([]),
		user
			? expiryReminderService.getSettings(user.id)
			: Promise.resolve({ enabled: false, days: 7 as const, lastSentAt: null }),
		user
			? shoppingPushService.getSettings(user.id)
			: Promise.resolve({ enabled: false, lastSentAt: null }),
		householdId && householdRole && canEditInventory(householdRole)
			? locals.inventoryService.getAutoExpiredGraceDays(householdId)
			: Promise.resolve(null),
		user
			? locals.planLimitsService.getSnapshot({
					userId: user.id,
					householdId,
					tier: planTier
				})
			: Promise.resolve(null),
		householdId ? locals.billingService.getBillingState(householdId) : Promise.resolve(null),
		user ? pushSubscriptionRepository.isPushEnabled(user.id) : Promise.resolve(false)
	]);

	const checkout = url.searchParams.get('checkout');
	const kivraForwardEnabled = isKivraForwardEnabled();
	const kivraForwardAddress =
		kivraForwardEnabled && householdId && householdRole && canEditInventory(householdRole)
			? buildKivraForwardAddress(await receiptForwardService.getForwardToken(householdId))
			: null;

	return {
		user,
		planTier,
		planLimits,
		billing,
		stripeCheckoutEnabled: isStripeCheckoutConfigured(),
		isPro: isProTier(planTier),
		checkoutStatus:
			checkout === 'success'
				? ('success' as const)
				: checkout === 'cancel'
					? ('cancel' as const)
					: checkout === 'portal'
						? ('portal' as const)
						: null,
		petsEnabled: Boolean(user?.petsEnabled),
		expiryRemindersEnabled: expirySettings.enabled,
		expiryReminderDays: expirySettings.days,
		pushNotificationsEnabled,
		shoppingPushEnabled: shoppingPushSettings.enabled,
		autoExpiredGraceDays,
		pets,
		household,
		householdRole,
		isOwner,
		pendingInvites,
		kivraForwardEnabled,
		kivraForwardAddress
	};
};

export const actions: Actions = {
	...billingActions,
	...notificationsActions,
	...petsActions,
	...householdActions
};
