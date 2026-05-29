import { canEditInventory } from '$lib/domain/household';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const summary = await locals.inventoryService.getDashboard(locals.householdId!);
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
	return { summary, canWrite };
};
