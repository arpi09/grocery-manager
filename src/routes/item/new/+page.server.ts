import { isStorageLocation } from '$lib/domain/location';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { itemSchema } from '$lib/validation/inventory.schemas';
import { buildScanReturnUrl } from '$lib/utils/scan-toast';
import { parseScanReturnTo } from '$lib/utils/scan-nav';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	requireInventoryWriteAccess(locals.householdRole);

	const locationParam = url.searchParams.get('location');
	const fromParam = url.searchParams.get('from');
	const defaultLocation =
		locationParam && isStorageLocation(locationParam) ? locationParam : 'fridge';
	const returnTo = parseScanReturnTo(fromParam);

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
		requireInventoryWriteAccess(event.locals.householdRole);

		const formData = await event.request.formData();
		const parsed = parseItemForm(formData);

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await event.locals.inventoryService.createItem(
			event.locals.householdId!,
			event.locals.user!.id,
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

		const returnToRaw = formData.get('returnTo');
		const safeReturn = parseScanReturnTo(
			typeof returnToRaw === 'string' ? returnToRaw : null
		);

		redirect(302, buildScanReturnUrl(safeReturn, 'added', parsed.data.name));
	}
};
