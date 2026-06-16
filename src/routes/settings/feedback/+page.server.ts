import { billingActions } from '../billing.actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	await parent();
	return {};
};

export const actions: Actions = {
	submitProductFeedback: billingActions.submitProductFeedback
};
