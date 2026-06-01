import { canEditInventory } from '$lib/domain/household';
import { INVENTORY_LIST_DEFAULT } from '$lib/domain/inventory-list';
import { isStorageLocation } from '$lib/domain/location';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!isStorageLocation(params.location)) {
		error(404, 'Unknown storage location');
	}

	const [items, activeTotal, finishedTotal] = await Promise.all([
		locals.inventoryService.listByLocationPaginated(
			locals.householdId!,
			params.location,
			INVENTORY_LIST_DEFAULT,
			0
		),
		locals.inventoryService.countActiveByLocation(locals.householdId!, params.location),
		locals.inventoryService.countFinishedByLocation(locals.householdId!, params.location)
	]);

	return {
		items,
		finishedItems: [],
		activeTotal,
		finishedTotal,
		location: params.location,
		canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false
	};
};
