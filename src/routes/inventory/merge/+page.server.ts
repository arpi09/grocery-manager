import { canEditInventory } from '$lib/domain/household';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const duplicateGroups = await locals.inventoryService
		.findDuplicateNameGroups(householdId)
		.catch(() => []);

	return {
		duplicateGroups,
		canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false
	};
};
