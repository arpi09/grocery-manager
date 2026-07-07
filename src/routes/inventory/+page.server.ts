import {
	InvalidConsumptionAmountError,
	InventoryNotFoundError
} from '$lib/application/inventory.service';
import { canConsumeInventory, canEditInventory } from '$lib/domain/household';
import { requireInventoryConsumeAccess, requireInventoryWriteAccess } from '$lib/server/household-auth';
import { trackOneTapConsume } from '$lib/server/sync-analytics';
import { consumeItemSchema } from '$lib/validation/consumption.schemas';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.householdId) {
		return {
			items: [],
			freshness: null,
			canWrite: false,
			canConsume: false,
			loadFailed: false
		};
	}

	try {
		const [items, freshness] = await Promise.all([
			locals.inventoryService.listAll(locals.householdId),
			locals.inventoryService.getPantryFreshness(locals.householdId)
		]);

		return {
			items,
			freshness,
			canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false,
			canConsume: locals.householdRole ? canConsumeInventory(locals.householdRole) : false,
			loadFailed: false
		};
	} catch {
		return {
			items: [],
			freshness: null,
			canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false,
			canConsume: locals.householdRole ? canConsumeInventory(locals.householdRole) : false,
			loadFailed: true
		};
	}
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
	},
	consumeItem: async ({ request, locals }) => {
		requireInventoryConsumeAccess(locals.householdRole);

		const formData = await request.formData();
		const itemId = formData.get('itemId');
		if (!itemId || typeof itemId !== 'string') {
			return fail(400, { message: 'missing_item_id' });
		}

		const parsed = consumeItemSchema.safeParse({
			consumptionPreset: formData.get('consumptionPreset') || undefined,
			consumptionAmount: formData.get('consumptionAmount') || undefined
		});
		if (!parsed.success) {
			return fail(400, { consumeErrors: parsed.error.flatten().fieldErrors });
		}

		try {
			const result = await locals.inventoryService.consumeItem(
				locals.householdId!,
				itemId,
				locals.user!.id,
				locals.householdRole!,
				{
					preset: parsed.data.preset ?? 'all',
					customAmount: parsed.data.customAmount
				}
			);
			if (formData.get('oneTap') === '1') {
				trackOneTapConsume(locals.pmfService, {
					userId: locals.user!.id,
					householdId: locals.householdId!,
					itemId
				});
			}
			return {
				success: true,
				finished: result.finished,
				itemName: result.item.name
			};
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				return fail(404, { message: 'not_found' });
			}
			if (e instanceof InvalidConsumptionAmountError) {
				return fail(400, { consumeErrors: { consumptionAmount: ['invalid'] } });
			}
			throw e;
		}
	}
};
