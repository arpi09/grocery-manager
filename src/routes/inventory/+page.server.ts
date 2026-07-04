import {
	InvalidConsumptionAmountError,
	InventoryNotFoundError
} from '$lib/application/inventory.service';
import { canConsumeInventory, canEditInventory } from '$lib/domain/household';
import { requireInventoryConsumeAccess } from '$lib/server/household-auth';
import { trackOneTapConsume } from '$lib/server/sync-analytics';
import { consumeItemSchema } from '$lib/validation/consumption.schemas';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.householdId) {
		return {
			items: [],
			canWrite: false,
			canConsume: false,
			loadFailed: false
		};
	}

	try {
		const items = await locals.inventoryService.listAll(locals.householdId);

		return {
			items,
			canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false,
			canConsume: locals.householdRole ? canConsumeInventory(locals.householdRole) : false,
			loadFailed: false
		};
	} catch {
		return {
			items: [],
			canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false,
			canConsume: locals.householdRole ? canConsumeInventory(locals.householdRole) : false,
			loadFailed: true
		};
	}
};

export const actions: Actions = {
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
