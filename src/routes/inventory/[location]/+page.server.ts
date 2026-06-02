import { canEditInventory } from '$lib/domain/household';
import { INVENTORY_LIST_DEFAULT } from '$lib/domain/inventory-list';
import { isStorageLocation } from '$lib/domain/location';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { appendActionToast } from '$lib/utils/action-toast';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!isStorageLocation(params.location)) {
		error(404, 'Unknown storage location');
	}

	const householdId = locals.householdId!;
	const location = params.location;

	const [items, activeTotal, finishedTotal, autoExpiredTotal, autoExpiredGraceDays] =
		await Promise.all([
			locals.inventoryService.listByLocationPaginated(
				householdId,
				location,
				INVENTORY_LIST_DEFAULT,
				0
			),
			locals.inventoryService.countActiveByLocation(householdId, location),
			locals.inventoryService.countFinishedByLocation(householdId, location),
			locals.inventoryService.countAutoExpiredByLocation(householdId, location),
			locals.inventoryService.getAutoExpiredGraceDays(householdId)
		]);

	return {
		items,
		finishedItems: [],
		activeTotal,
		finishedTotal,
		autoExpiredTotal,
		autoExpiredGraceDays,
		location,
		canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false
	};
};

export const actions: Actions = {
	bulkDiscardAutoExpired: async ({ params, locals }) => {
		requireInventoryWriteAccess(locals.householdRole);

		if (!isStorageLocation(params.location)) {
			error(404, 'Unknown storage location');
		}

		const count = await locals.inventoryService.bulkDiscardAutoExpired(
			locals.householdId!,
			params.location,
			locals.user!.id,
			locals.householdRole!
		);

		const label = count > 0 ? String(count) : undefined;
		redirect(
			302,
			appendActionToast(`/inventory/${params.location}`, 'autoExpiredCleared', label)
		);
	}
};
