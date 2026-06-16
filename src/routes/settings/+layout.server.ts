import { isHouseholdOwner } from '$lib/domain/household';
import { DEFAULT_PLAN_TIER, isProTier } from '$lib/domain/plan';
import { isAdminRole } from '$lib/domain/user';
import { billingActions } from './billing.actions';
import { householdActions } from './household.actions';
import { notificationsActions } from './notifications.actions';
import { petsActions } from './pets.actions';
import { suggestionsActions } from './suggestions.actions';
import type { Actions, LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const householdId = locals.householdId;
	const householdRole = locals.householdRole;
	const planTier = locals.planTier ?? DEFAULT_PLAN_TIER;
	const isOwner = householdRole ? isHouseholdOwner(householdRole) : false;

	const household = user
		? await locals.householdService.getHouseholdForUser(user.id)
		: Promise.resolve(null);

	return {
		user,
		householdId,
		householdRole,
		planTier,
		isOwner,
		isAdmin: isAdminRole(user?.role),
		isPro: isProTier(planTier),
		household: await household
	};
};

export const actions: Actions = {
	...billingActions,
	...notificationsActions,
	...petsActions,
	...householdActions,
	...suggestionsActions
};
