import {
	InvalidConsumptionAmountError,
	InventoryNotFoundError
} from '$lib/application/inventory.service';
import { canConsumeInventory, canEditInventory } from '$lib/domain/household';
import { INVENTORY_LIST_DEFAULT } from '$lib/domain/inventory-list';
import { isStorageLocation } from '$lib/domain/location';
import {
	requireInventoryConsumeAccess,
	requireInventoryWriteAccess
} from '$lib/server/household-auth';
import { trackOneTapConsume } from '$lib/server/sync-analytics';
import { consumeItemSchema } from '$lib/validation/consumption.schemas';
import { appendActionToast } from '$lib/utils/action-toast';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function parseItemIds(formData: FormData): string[] {
	return formData
		.getAll('itemIds')
		.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
}

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
		canWrite: locals.householdRole ? canEditInventory(locals.householdRole) : false,
		canConsume: locals.householdRole ? canConsumeInventory(locals.householdRole) : false
	};
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
	},
	bulkInferExpiry: async ({ params, locals }) => {
		requireInventoryWriteAccess(locals.householdRole);
		if (!isStorageLocation(params.location)) {
			error(404, 'Unknown storage location');
		}
		const inferred = await locals.inventoryService.bulkInferExpiryForLocation(
			locals.householdId!,
			params.location,
			locals.householdRole!
		);
		redirect(
			302,
			appendActionToast(`/inventory/${params.location}?filter=noExpiry`, 'bulkExpiryInferred', String(inferred))
		);
	},
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

		const activeRemaining = await locals.inventoryService.countActiveByLocation(
			locals.householdId!,
			params.location
		);

		const label = count > 0 ? String(count) : undefined;
		redirect(
			302,
			appendActionToast(
				`/inventory/${params.location}`,
				'autoExpiredCleared',
				label,
				String(activeRemaining)
			)
		);
	},
	bulkConsumeItems: async ({ request, locals }) => {
		requireInventoryConsumeAccess(locals.householdRole);

		const itemIds = parseItemIds(await request.formData());
		if (itemIds.length === 0) {
			return fail(400, { message: 'missing_item_ids' });
		}

		const count = await locals.inventoryService.consumeItemsMany(
			locals.householdId!,
			itemIds,
			locals.user!.id,
			locals.householdRole!
		);

		return { success: true, count };
	},
	bulkDeleteItems: async ({ request, locals }) => {
		requireInventoryWriteAccess(locals.householdRole);

		const itemIds = parseItemIds(await request.formData());
		if (itemIds.length === 0) {
			return fail(400, { message: 'missing_item_ids' });
		}

		const count = await locals.inventoryService.deleteItemsMany(
			locals.householdId!,
			itemIds,
			locals.user!.id,
			locals.householdRole!
		);

		return { success: true, count };
	}
};
