import { InventoryNotFoundError } from '$lib/application/inventory.service';
import { canEditInventory } from '$lib/domain/household';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const [items, remaining] = await Promise.all([
		locals.inventoryService.listStaleUndatedBatch(householdId),
		locals.inventoryService.countStaleUndated(householdId)
	]);

	return {
		items: items.map((item) => ({
			...item,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			lastConfirmedAt: item.lastConfirmedAt.toISOString()
		})),
		remaining,
		canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false
	};
};

export const actions: Actions = {
	undoConsume: async ({ request, locals }) => {
		requireInventoryWriteAccess(locals.householdRole);

		const formData = await request.formData();
		const itemId = formData.get('itemId');
		const quantity = formData.get('quantity');
		if (!itemId || typeof itemId !== 'string' || !quantity || typeof quantity !== 'string') {
			return fail(400, { message: 'missing_restore_fields' });
		}

		try {
			await locals.inventoryService.updateItem(
				locals.householdId!,
				itemId,
				{ quantity },
				locals.householdRole!
			);
			return { success: true };
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				return fail(404, { message: 'not_found' });
			}
			throw e;
		}
	}
};
