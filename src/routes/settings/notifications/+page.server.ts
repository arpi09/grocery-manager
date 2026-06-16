import { canEditInventory } from '$lib/domain/household';
import {
	expiryReminderService,
	pushSubscriptionRepository,
	shoppingPushService
} from '$lib/server/di';
import { notificationsActions } from '../notifications.actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user, householdId, householdRole } = await parent();

	const [expirySettings, shoppingPushSettings, autoExpiredGraceDays, pushNotificationsEnabled, shoppingToPantryMode] =
		await Promise.all([
			user
				? expiryReminderService.getSettings(user.id)
				: Promise.resolve({ enabled: false, days: 7 as const, lastSentAt: null }),
			user
				? shoppingPushService.getSettings(user.id)
				: Promise.resolve({ enabled: false, lastSentAt: null }),
			householdId && householdRole && canEditInventory(householdRole)
				? locals.inventoryService.getAutoExpiredGraceDays(householdId)
				: Promise.resolve(null),
			user ? pushSubscriptionRepository.isPushEnabled(user.id) : Promise.resolve(false),
			user
				? locals.profileService.getShoppingToPantryMode(user.id)
				: Promise.resolve('ask' as const)
		]);

	return {
		expiryRemindersEnabled: expirySettings.enabled,
		expiryReminderDays: expirySettings.days,
		pushNotificationsEnabled,
		shoppingPushEnabled: shoppingPushSettings.enabled,
		autoExpiredGraceDays,
		shoppingToPantryMode
	};
};

export const actions: Actions = notificationsActions;
