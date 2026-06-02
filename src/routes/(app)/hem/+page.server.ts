import { canEditInventory } from '$lib/domain/household';
import type { GamificationCelebrationKind } from '$lib/domain/gamification';
import {
	createHouseholdAction,
	leaveHouseholdAction,
	switchHouseholdAction
} from '$lib/server/pantry-actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const userId = locals.user!.id;
	const [summary, engagement, celebration] = await Promise.all([
		locals.inventoryService.getDashboard(householdId),
		locals.gamificationService.getEngagementStrip(householdId, userId),
		locals.gamificationService.detectZeroWasteCelebration(householdId)
	]);
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
	return {
		summary,
		engagement,
		celebration: celebration as GamificationCelebrationKind | null,
		canWrite
	};
};

export const actions: Actions = {
	switchHousehold: switchHouseholdAction,
	createHousehold: createHouseholdAction,
	leaveHousehold: leaveHouseholdAction
};
