import { canConsumeInventory, canEditInventory } from '$lib/domain/household';
import { isPantryUxV2Enabled } from '$lib/server/pantry-ux-v2-flag';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pantryUxV2Enabled = isPantryUxV2Enabled();

	if (!pantryUxV2Enabled) {
		redirect(302, '/inventory/fridge');
	}

	if (!locals.householdId) {
		return {
			pantryUxV2Enabled: true,
			items: [],
			canWrite: false,
			canConsume: false,
			loadFailed: false
		};
	}

	try {
		const items = await locals.inventoryService.listAll(locals.householdId);

		return {
			pantryUxV2Enabled: true,
			items,
			canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false,
			canConsume: locals.householdRole ? canConsumeInventory(locals.householdRole) : false,
			loadFailed: false
		};
	} catch {
		return {
			pantryUxV2Enabled: true,
			items: [],
			canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false,
			canConsume: locals.householdRole ? canConsumeInventory(locals.householdRole) : false,
			loadFailed: true
		};
	}
};
