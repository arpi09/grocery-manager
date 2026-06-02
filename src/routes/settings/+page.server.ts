import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { appendActionToast } from '$lib/utils/action-toast';
import { fail, redirect } from '@sveltejs/kit';
import { mapHouseholdErrorToFail } from '$lib/application/household-errors';
import { translate } from '$lib/i18n/messages';
import { canEditInventory, isHouseholdOwner } from '$lib/domain/household';
import { DEFAULT_PLAN_TIER } from '$lib/domain/plan';
import { householdInviteEmailWarning, sendHouseholdInviteEmail } from '$lib/server/email';
import { getAppOrigin } from '$lib/server/origin';
import {
	createHouseholdInviteSchema,
	deleteHouseholdSchema,
	removeMemberSchema,
	revokeInviteSchema,
	updateMemberRoleSchema
} from '$lib/validation/household.schemas';
import {
	createPetSchema,
	deletePetSchema,
	updatePetsEnabledSchema
} from '$lib/validation/pet.schemas';
import { updateExpiryRemindersSchema } from '$lib/validation/expiry-reminder.schemas';
import { updateAutoExpiredGraceSchema } from '$lib/validation/auto-expired.schemas';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { updateShoppingPushSchema } from '$lib/validation/shopping-push.schemas';
import { submitProductFeedbackSchema } from '$lib/validation/product-feedback.schemas';
import { joinWaitlistSchema } from '$lib/validation/waitlist.schemas';
import { expiryReminderService, shoppingPushService } from '$lib/server/di';
import { DrizzlePushSubscriptionRepository } from '$lib/infrastructure/repositories/push-subscription.repository';
import type { Actions, PageServerLoad } from './$types';

const pushRepository = new DrizzlePushSubscriptionRepository();

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const pets = user ? await locals.petService.listPets(user.id) : [];
	const household = user ? await locals.householdService.getHouseholdForUser(user.id) : null;
	const householdId = locals.householdId;
	const householdRole = locals.householdRole;
	const isOwner = householdRole ? isHouseholdOwner(householdRole) : false;
	const pendingInvites =
		user && householdId && isOwner
			? await locals.householdService.listPendingInvites(householdId, user.id)
			: [];
	const expirySettings = user
		? await expiryReminderService.getSettings(user.id)
		: { enabled: false, days: 7 as const, lastSentAt: null };
	const shoppingPushSettings = user
		? await shoppingPushService.getSettings(user.id)
		: { enabled: false, lastSentAt: null };
	const autoExpiredGraceDays =
		householdId && householdRole && canEditInventory(householdRole)
			? await locals.inventoryService.getAutoExpiredGraceDays(householdId)
			: null;

	const planTier = DEFAULT_PLAN_TIER;
	const planLimits = user
		? await locals.planLimitsService.getSnapshot({
				userId: user.id,
				householdId,
				tier: planTier
			})
		: null;

	return {
		user,
		planTier,
		planLimits,
		petsEnabled: Boolean(user?.petsEnabled),
		expiryRemindersEnabled: expirySettings.enabled,
		expiryReminderDays: expirySettings.days,
		pushNotificationsEnabled: user ? await pushRepository.isPushEnabled(user.id) : false,
		shoppingPushEnabled: shoppingPushSettings.enabled,
		autoExpiredGraceDays,
		pets,
		household,
		householdRole,
		isOwner,
		pendingInvites
	};
};

export const actions: Actions = {
	submitProductFeedback: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = submitProductFeedbackSchema.safeParse({
			source: formData.get('source'),
			churnReason: formData.get('churnReason'),
			message: formData.get('message') ?? ''
		});

		if (!parsed.success) {
			return fail(400, { feedbackErrors: parsed.error.flatten().fieldErrors });
		}

		await locals.productFeedbackService.submit({
			userId: locals.user!.id,
			householdId: locals.householdId,
			source: parsed.data.source,
			churnReason: parsed.data.churnReason ?? null,
			message: parsed.data.message
		});

		return { feedbackSuccess: true };
	},
	joinProWaitlist: async ({ request, locals }) => {
		const formData = await request.formData();
		const emailFromForm = formData.get('email');
		const parsed = joinWaitlistSchema.safeParse({
			email: typeof emailFromForm === 'string' && emailFromForm.trim()
				? emailFromForm
				: locals.user!.email,
			source: 'settings'
		});

		if (!parsed.success) {
			return fail(400, { waitlistErrors: parsed.error.flatten().fieldErrors });
		}

		const result = await locals.waitlistService.join({
			email: parsed.data.email,
			userId: locals.user!.id,
			source: parsed.data.source
		});

		return {
			waitlistSuccess: true,
			waitlistAlreadySignedUp: result === 'exists'
		};
	},
	updateExpiryReminders: async ({ request, locals }) => {
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
	updateAutoExpiredGrace: async ({ request, locals }) => {
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
	updateShoppingPush: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updateShoppingPushSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { shoppingPushErrors: parsed.error.flatten().fieldErrors });
		}

		const enabled = parsed.data.enabled === 'true';
		if (enabled) {
			const hasPush = await pushRepository.isPushEnabled(locals.user!.id);
			if (!hasPush) {
				return fail(400, { shoppingPushError: 'push_required' });
			}
		}

		await shoppingPushService.updateSettings(locals.user!.id, enabled);
		redirect(302, appendActionToast('/settings', 'settingsSaved'));
	},
	togglePets: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updatePetsEnabledSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.setPetsEnabled(locals.user!.id, parsed.data.enabled === 'true');
		redirect(302, appendActionToast('/settings', 'settingsSaved'));
	},
	addPet: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = createPetSchema.safeParse({
			name: formData.get('name'),
			species: formData.get('species')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.addPet(
			locals.user!.id,
			parsed.data.name,
			parsed.data.species || null
		);
		redirect(302, appendActionToast('/settings', 'petAdded', parsed.data.name));
	},
	deletePet: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = deletePetSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		const pets = await locals.petService.listPets(locals.user!.id);
		const pet = pets.find((entry) => entry.id === parsed.data.id);

		await locals.petService.deletePet(locals.user!.id, parsed.data.id);
		redirect(302, appendActionToast('/settings', 'petRemoved', pet?.name));
	},
	createInvite: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const parsed = createHouseholdInviteSchema.safeParse({
			email: formData.get('email'),
			role: formData.get('role')
		});

		if (!parsed.success) {
			return fail(400, { inviteErrors: parsed.error.flatten().fieldErrors });
		}

		try {
			const { invite, token } = await locals.householdService.createInvite(
				locals.householdId!,
				locals.user!.id,
				parsed.data.email,
				parsed.data.role
			);
			const household = await locals.householdService.getHouseholdForUser(locals.user!.id);
			const inviterName = locals.user!.displayName?.trim() || locals.user!.email;
			const inviteUrl = `${getAppOrigin(url.origin)}/invite/${token}`;
			const emailResult = await sendHouseholdInviteEmail({
				to: invite.email,
				inviterName,
				householdName: household?.name ?? 'Pantry',
				inviteUrl,
				role: invite.role
			});

			return {
				inviteLink: inviteUrl,
				inviteEmailWarning: emailResult.ok
					? undefined
					: householdInviteEmailWarning(emailResult)
			};
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}
	},
	revokeInvite: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = revokeInviteSchema.safeParse({
			inviteId: formData.get('inviteId')
		});

		if (!parsed.success) {
			return fail(400, {
				householdError: translate(locals.locale, 'errors.household.invalidInvite')
			});
		}

		try {
			await locals.householdService.revokeInvite(
				locals.householdId!,
				locals.user!.id,
				parsed.data.inviteId
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}

		redirect(302, appendActionToast('/settings', 'inviteRevoked'));
	},
	updateMemberRole: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updateMemberRoleSchema.safeParse({
			userId: formData.get('userId'),
			role: formData.get('role')
		});

		if (!parsed.success) {
			return fail(400, {
				householdError: translate(locals.locale, 'errors.household.invalidRole')
			});
		}

		try {
			await locals.householdService.updateMemberRole(
				locals.householdId!,
				locals.user!.id,
				parsed.data.userId,
				parsed.data.role
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}

		redirect(302, appendActionToast('/settings', 'memberUpdated'));
	},
	removeMember: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = removeMemberSchema.safeParse({
			userId: formData.get('userId')
		});

		if (!parsed.success) {
			return fail(400, {
				householdError: translate(locals.locale, 'errors.household.invalidMember')
			});
		}

		try {
			await locals.householdService.removeMember(
				locals.householdId!,
				locals.user!.id,
				parsed.data.userId
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}

		redirect(302, appendActionToast('/settings', 'memberRemoved'));
	},
	deleteHousehold: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = deleteHouseholdSchema.safeParse({
			householdId: formData.get('householdId'),
			confirmName: formData.get('confirmName')
		});

		if (!parsed.success) {
			const confirmError = parsed.error.flatten().fieldErrors.confirmName?.[0];
			return fail(400, {
				householdError:
					confirmError === 'Skriv hushållets namn eller TA BORT för att bekräfta'
						? translate(locals.locale, 'errors.validation.deleteConfirm')
						: translate(locals.locale, 'errors.household.invalidConfirm')
			});
		}

		try {
			await locals.householdService.deleteHousehold(
				parsed.data.householdId,
				locals.user!.id,
				parsed.data.confirmName
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}

		redirect(302, APP_HOME_PATH);
	}
};
