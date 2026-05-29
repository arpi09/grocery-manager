import { canEditInventory } from '$lib/domain/household';
import {
	createHouseholdAction,
	leaveHouseholdAction,
	switchHouseholdAction
} from '$lib/server/pantry-actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const summary = await locals.inventoryService.getDashboard(locals.householdId!);
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
	return { summary, canWrite };
};

export const actions: Actions = {
	switchHousehold: switchHouseholdAction,
	createHousehold: createHouseholdAction,
	leaveHousehold: leaveHouseholdAction
};
