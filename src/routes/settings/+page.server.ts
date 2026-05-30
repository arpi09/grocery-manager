import { fail, redirect } from '@sveltejs/kit';
import { mapHouseholdErrorToFail } from '$lib/application/household-errors';
import { isHouseholdOwner } from '$lib/domain/household';
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
import type { Actions, PageServerLoad } from './$types';

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

	return {
		user,
		petsEnabled: Boolean(user?.petsEnabled),
		pets,
		household,
		householdRole,
		isOwner,
		pendingInvites
	};
};

export const actions: Actions = {
	togglePets: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updatePetsEnabledSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.setPetsEnabled(locals.user!.id, parsed.data.enabled === 'true');
		redirect(302, '/settings');
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
		redirect(302, '/settings');
	},
	deletePet: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = deletePetSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.deletePet(locals.user!.id, parsed.data.id);
		redirect(302, '/settings');
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
				inviteEmailWarning: !emailResult.ok ? householdInviteEmailWarning(emailResult) : undefined
			};
		} catch (error) {
			return mapHouseholdErrorToFail(error);
		}
	},
	revokeInvite: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = revokeInviteSchema.safeParse({
			inviteId: formData.get('inviteId')
		});

		if (!parsed.success) {
			return fail(400, { householdError: 'Ogiltig inbjudan.' });
		}

		try {
			await locals.householdService.revokeInvite(
				locals.householdId!,
				locals.user!.id,
				parsed.data.inviteId
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error);
		}

		redirect(302, '/settings');
	},
	updateMemberRole: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updateMemberRoleSchema.safeParse({
			userId: formData.get('userId'),
			role: formData.get('role')
		});

		if (!parsed.success) {
			return fail(400, { householdError: 'Ogiltig roll.' });
		}

		try {
			await locals.householdService.updateMemberRole(
				locals.householdId!,
				locals.user!.id,
				parsed.data.userId,
				parsed.data.role
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error);
		}

		redirect(302, '/settings');
	},
	removeMember: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = removeMemberSchema.safeParse({
			userId: formData.get('userId')
		});

		if (!parsed.success) {
			return fail(400, { householdError: 'Ogiltig medlem.' });
		}

		try {
			await locals.householdService.removeMember(
				locals.householdId!,
				locals.user!.id,
				parsed.data.userId
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error);
		}

		redirect(302, '/settings');
	},
	deleteHousehold: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = deleteHouseholdSchema.safeParse({
			householdId: formData.get('householdId'),
			confirmName: formData.get('confirmName')
		});

		if (!parsed.success) {
			return fail(400, {
				householdError: parsed.error.flatten().fieldErrors.confirmName?.[0] ?? 'Ogiltig bekräftelse.'
			});
		}

		try {
			await locals.householdService.deleteHousehold(
				parsed.data.householdId,
				locals.user!.id,
				parsed.data.confirmName
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error);
		}

		redirect(302, '/');
	}
};
