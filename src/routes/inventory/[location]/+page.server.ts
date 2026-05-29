import { canEditInventory } from '$lib/domain/household';
import { isStorageLocation } from '$lib/domain/location';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!isStorageLocation(params.location)) {
		error(404, 'Unknown storage location');
	}

	const items = await locals.inventoryService.listByLocation(
		locals.householdId!,
		params.location
	);

	return {
		items,
		location: params.location,
		canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false
	};
};
