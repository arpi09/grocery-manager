import { InventoryNotFoundError } from '$lib/application/inventory.service';
import { itemSchema } from '$lib/validation/inventory.schemas';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
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
		const parsed = parseItemForm(await event.request.formData());

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		try {
			await event.locals.inventoryService.updateItem(event.locals.householdId!, event.params.id, {
				name: parsed.data.name,
				location: parsed.data.location,
				quantity: parsed.data.quantity,
				unit: parsed.data.unit || null,
				expiresOn: parsed.data.expiresOn || null,
				notes: parsed.data.notes || null
			});
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				error(404, 'Item not found');
			}
			throw e;
		}

		redirect(302, `/inventory/${parsed.data.location}`);
	},
	delete: async (event) => {
		let location = 'fridge';
		try {
			const item = await event.locals.inventoryService.getItem(
				event.locals.householdId!,
				event.params.id
			);
			location = item.location;
			await event.locals.inventoryService.deleteItem(event.locals.householdId!, event.params.id);
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				error(404, 'Item not found');
			}
			throw e;
		}

		redirect(302, `/inventory/${location}`);
	}
};
