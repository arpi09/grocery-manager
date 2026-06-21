import { accountActions } from '../account.actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();

	const deletionImpact = user
		? await locals.accountService.getDeletionImpact(user.id)
		: { sharedHouseholdCount: 0, soleMemberHouseholdCount: 0 };

	return { deletionImpact };
};

export const actions: Actions = accountActions;
