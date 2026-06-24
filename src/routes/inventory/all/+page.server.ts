import {
	InvalidConsumptionAmountError,
	InventoryNotFoundError
} from '$lib/application/inventory.service';
import { canConsumeInventory, canEditInventory } from '$lib/domain/household';
import { isPantryUxV2Enabled } from '$lib/server/pantry-ux-v2-flag';
import {
	requireInventoryConsumeAccess,
	requireInventoryWriteAccess
} from '$lib/server/household-auth';
import { trackOneTapConsume } from '$lib/server/sync-analytics';
import { consumeItemSchema } from '$lib/validation/consumption.schemas';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { appendActionToast } from '$lib/utils/action-toast';
import { bulkInferMissingExpiryAllLocations } from '$lib/server/bulk-infer-missing-expiry';
import { learningFeedbackRepository } from '$lib/server/di';
import { getOpenAiApiKey } from '$lib/server/openai';

function parseItemIds(formData: FormData): string[] {
	return formData
		.getAll('itemIds')
		.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!isPantryUxV2Enabled()) {
		const filter = url.searchParams.get('filter');
		const suffix = filter ? `?filter=${filter}` : '';
		redirect(302, `/inventory/fridge${suffix}`);
	}

	const householdId = locals.householdId!;

	const [items, activeTotal] = await Promise.all([
		locals.inventoryService.listAll(householdId),
		locals.inventoryService.countActiveInventory(householdId)
	]);

	const itemsWithImages = await locals.productCatalogService.enrichInventoryItems(items);

	return {
		items: itemsWithImages,
		activeTotal,
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
	},
	bulkInferExpiry: async ({ locals, url }) => {
		requireInventoryWriteAccess(locals.householdRole);
		const inferred = await bulkInferMissingExpiryAllLocations(
			locals.householdId!,
			locals.inventoryService,
			getOpenAiApiKey(),
			locals.householdRole!,
			learningFeedbackRepository
		);
		const filter = url.searchParams.get('filter');
		const redirectPath =
			filter === 'noExpiry' ? '/inventory/all?filter=noExpiry' : '/inventory/all';
		redirect(
			302,
			appendActionToast(redirectPath, 'bulkExpiryInferred', String(inferred))
		);
	}
};
