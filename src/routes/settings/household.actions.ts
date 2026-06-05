import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { appendActionToast } from '$lib/utils/action-toast';
import { fail, redirect } from '@sveltejs/kit';
import { mapHouseholdErrorToFail } from '$lib/application/household-errors';
import { translate } from '$lib/i18n/messages';
import { canEditInventory } from '$lib/domain/household';
import { householdInviteEmailWarning, sendHouseholdInviteEmail } from '$lib/server/email';
import { getAppOrigin } from '$lib/server/origin';
import {
	createHouseholdInviteSchema,
	createShareInviteSchema,
	deleteHouseholdSchema,
	removeMemberSchema,
	revokeInviteSchema,
	updateHouseholdSchema,
	updateMemberRoleSchema
} from '$lib/validation/household.schemas';
import type { RequestEvent } from '@sveltejs/kit';

export const householdActions = {
	updateHousehold: async ({ request, locals }: RequestEvent) => {
		if (!canEditInventory(locals.householdRole!)) {
			return fail(403, {
				householdError: translate(locals.locale, 'errors.household.forbidden')
			});
		}

		const formData = await request.formData();
		const parsed = updateHouseholdSchema.safeParse({
			name: formData.get('name')
		});

		if (!parsed.success) {
			return fail(400, {
				householdNameErrors: parsed.error.flatten().fieldErrors,
				householdError:
					parsed.error.flatten().fieldErrors.name?.[0] ?? 'Ogiltigt namn.'
			});
		}

		try {
			await locals.householdService.updateHouseholdName(
				locals.householdId!,
				locals.user!.id,
				parsed.data.name
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}

		redirect(302, appendActionToast('/settings', 'householdRenamed', parsed.data.name));
	},
	createShareInvite: async ({ request, locals, url }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = createShareInviteSchema.safeParse({
			role: formData.get('role')
		});

		if (!parsed.success) {
			return fail(400, {
				householdError: translate(locals.locale, 'errors.household.invalidRole')
			});
		}

		try {
			const { token } = await locals.householdService.createShareInvite(
				locals.householdId!,
				locals.user!.id,
				parsed.data.role
			);
			const inviteUrl = `${getAppOrigin(url.origin)}/invite/${token}`;

			return { inviteLink: inviteUrl };
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}
	},
	createInvite: async ({ request, locals, url }: RequestEvent) => {
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
			const emailLocale = locals.locale === 'en' ? 'en' : 'sv';
			const emailResult = await sendHouseholdInviteEmail({
				to: invite.email,
				inviterName,
				householdName: household?.name ?? 'Pantry',
				inviteUrl,
				role: invite.role,
				locale: emailLocale
			});

			if (emailResult.ok) {
				redirect(302, appendActionToast('/settings', 'inviteSent'));
			}

			return {
				inviteLink: inviteUrl,
				inviteEmailWarning: householdInviteEmailWarning(locals.locale, emailResult)
			};
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'householdError', locals.locale);
		}
	},
	revokeInvite: async ({ request, locals }: RequestEvent) => {
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
	updateMemberRole: async ({ request, locals }: RequestEvent) => {
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
	removeMember: async ({ request, locals }: RequestEvent) => {
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
	deleteHousehold: async ({ request, locals }: RequestEvent) => {
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
