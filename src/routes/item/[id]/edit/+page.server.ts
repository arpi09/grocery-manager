import {
	InvalidConsumptionAmountError,
	InventoryNotFoundError
} from '$lib/application/inventory.service';
import { consumeItemSchema } from '$lib/validation/consumption.schemas';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { itemSchema } from '$lib/validation/inventory.schemas';
import { appendActionToast } from '$lib/utils/action-toast';
import { appendCelebration } from '$lib/utils/gamification-celebrate';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireInventoryWriteAccess(locals.householdRole);

	try {
		const item = await locals.inventoryService.getItem(locals.householdId!, params.id);
		return { item };
	} catch (e) {
		if (e instanceof InventoryNotFoundError) {
			error(404, 'Item not found');
		}
		throw e;
	}
};

function parseItemForm(formData: FormData) {
	const raw = Object.fromEntries(formData);
	return itemSchema.safeParse({
		...raw,
		unit: raw.unit || undefined,
		expiresOn: raw.expiresOn || undefined,
		notes: raw.notes || undefined
	});
}

export const actions: Actions = {
	save: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		const parsed = parseItemForm(await event.request.formData());

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		try {
			await event.locals.inventoryService.updateItem(
				event.locals.householdId!,
				event.params.id,
				{
					name: parsed.data.name,
					location: parsed.data.location,
					quantity: parsed.data.quantity,
					unit: parsed.data.unit || null,
					expiresOn: parsed.data.expiresOn || null,
					notes: parsed.data.notes || null
				},
				event.locals.householdRole!
			);
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				error(404, 'Item not found');
			}
			throw e;
		}

		redirect(302, appendActionToast(`/inventory/${parsed.data.location}`, 'itemUpdated', parsed.data.name));
	},
	delete: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		let location = 'fridge';
		let itemName = '';
		try {
			const item = await event.locals.inventoryService.getItem(
				event.locals.householdId!,
				event.params.id
			);
			location = item.location;
			itemName = item.name;
			await event.locals.inventoryService.deleteItem(
				event.locals.householdId!,
				event.params.id,
				event.locals.user!.id,
				event.locals.householdRole!
			);
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				error(404, 'Item not found');
			}
			throw e;
		}

		redirect(302, appendActionToast(`/inventory/${location}`, 'itemDeleted', itemName));
	},
	markAsFinished: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		const formData = await event.request.formData();
		const parsed = consumeItemSchema.safeParse({
			consumptionPreset: formData.get('consumptionPreset') || undefined,
			consumptionAmount: formData.get('consumptionAmount') || undefined
		});
		if (!parsed.success) {
			return fail(400, { consumeErrors: parsed.error.flatten().fieldErrors });
		}

		let location = 'fridge';
		let itemName = '';
		let toastKind: 'itemFinished' | 'itemPartiallyConsumed' = 'itemFinished';
		try {
			const result = await event.locals.inventoryService.consumeItem(
				event.locals.householdId!,
				event.params.id,
				event.locals.user!.id,
				event.locals.householdRole!,
				{ preset: parsed.data.preset, customAmount: parsed.data.customAmount }
			);
			location = result.item.location;
			itemName = result.item.name;
			if (!result.finished) toastKind = 'itemPartiallyConsumed';
		} catch (e) {
			if (e instanceof InventoryNotFoundError) error(404, 'Item not found');
			if (e instanceof InvalidConsumptionAmountError) {
				return fail(400, { consumeErrors: { consumptionAmount: ['invalid'] } });
			}
			throw e;
		}

		const celebration =
			toastKind === 'itemFinished'
				? await event.locals.gamificationService.detectMarkFinishedCelebration(
						event.locals.householdId!
					)
				: null;
		let redirectPath = appendActionToast(`/inventory/${location}`, toastKind, itemName);
		if (celebration) redirectPath = appendCelebration(redirectPath, celebration);
		redirect(302, redirectPath);
	}
};
