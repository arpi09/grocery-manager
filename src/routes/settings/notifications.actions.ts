import { fail, redirect } from '@sveltejs/kit';
import { appendActionToast } from '$lib/utils/action-toast';
import { updateExpiryRemindersSchema } from '$lib/validation/expiry-reminder.schemas';
import { updateAutoExpiredGraceSchema } from '$lib/validation/auto-expired.schemas';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { updateShoppingPushSchema } from '$lib/validation/shopping-push.schemas';
import { expiryReminderService, pushSubscriptionRepository, shoppingPushService } from '$lib/server/di';
import type { RequestEvent } from '@sveltejs/kit';

export const notificationsActions = {
	updateExpiryReminders: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = updateExpiryRemindersSchema.safeParse({
			enabled: formData.get('enabled'),
			days: formData.get('days')
		});

		if (!parsed.success) {
			return fail(400, { expiryReminderErrors: parsed.error.flatten().fieldErrors });
		}

		await expiryReminderService.updateSettings(
			locals.user!.id,
			parsed.data.enabled === 'true',
			Number(parsed.data.days) as 3 | 7
		);
		redirect(302, appendActionToast('/settings', 'settingsSaved'));
	},
	updateAutoExpiredGrace: async ({ request, locals }: RequestEvent) => {
		requireInventoryWriteAccess(locals.householdRole);

		const formData = await request.formData();
		const parsed = updateAutoExpiredGraceSchema.safeParse({
			days: formData.get('days')
		});

		if (!parsed.success) {
			return fail(400, { autoExpiredGraceErrors: parsed.error.flatten().fieldErrors });
		}

		await locals.inventoryService.updateAutoExpiredGraceDays(
			locals.householdId!,
			Number(parsed.data.days),
			locals.householdRole!
		);
		redirect(302, appendActionToast('/settings', 'settingsSaved'));
	},
	updateShoppingPush: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = updateShoppingPushSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { shoppingPushErrors: parsed.error.flatten().fieldErrors });
		}

		const enabled = parsed.data.enabled === 'true';
		if (enabled) {
			const hasPush = await pushSubscriptionRepository.isPushEnabled(locals.user!.id);
			if (!hasPush) {
				return fail(400, { shoppingPushError: 'push_required' });
			}
		}

		await shoppingPushService.updateSettings(locals.user!.id, enabled);
		redirect(302, appendActionToast('/settings', 'settingsSaved'));
	}
};
