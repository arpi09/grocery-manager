import { isStorageLocation } from '$lib/domain/location';
import { itemSchema } from '$lib/validation/inventory.schemas';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const locationParam = url.searchParams.get('location');
	const fromParam = url.searchParams.get('from');
	const defaultLocation =
		locationParam && isStorageLocation(locationParam) ? locationParam : 'fridge';
	const returnTo =
		fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : '/';

	return { defaultLocation, returnTo };
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
	create: async (event) => {
		const parsed = parseItemForm(await event.request.formData());

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await event.locals.inventoryService.createItem(event.locals.user!.id, {
			name: parsed.data.name,
			location: parsed.data.location,
			quantity: parsed.data.quantity,
			unit: parsed.data.unit || null,
			expiresOn: parsed.data.expiresOn || null,
			notes: parsed.data.notes || null
		});

		redirect(302, `/inventory/${parsed.data.location}`);
	}
};
