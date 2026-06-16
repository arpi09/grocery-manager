import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user, household, householdId, isOwner } = await parent();

	if (!household) {
		throw redirect(302, '/settings');
	}

	const pendingInvites =
		user && householdId && isOwner
			? await locals.householdService.listPendingInvites(householdId, user.id)
			: [];

	return { pendingInvites };
};
