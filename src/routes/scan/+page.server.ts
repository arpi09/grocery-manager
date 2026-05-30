import { isStorageLocation } from '$lib/domain/location';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { itemSchema } from '$lib/validation/inventory.schemas';
import { buildScanReturnUrl, type ScanToastKind } from '$lib/utils/scan-toast';
import { recordProductEvent } from '$lib/server/product-events';
import { fail, redirect } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;

	const locationParam = url.searchParams.get('location');
	const fromParam = url.searchParams.get('from');
	const modeParam = url.searchParams.get('mode');
	const defaultLocation =
		locationParam && isStorageLocation(locationParam) ? locationParam : 'fridge';
	const returnTo =
		fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : '/';
	const scanMode = modeParam === 'barcode' ? 'barcode' : 'hub';

	return { defaultLocation, returnTo, canWrite, scanMode };
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

		const returnTo = String(formData.get('returnTo') ?? '/');
		const safeReturn =
			returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
		const productFound = formData.get('productFound') === '1';

		recordProductEvent(event.locals.pmfService, {
			userId: event.locals.user!.id,
			householdId: event.locals.householdId,
			eventType: 'scan_completed',
			metadata: { source: 'barcode', productFound }
		});

		const toastKind: ScanToastKind = productFound ? 'added' : 'unknown';
		const target =
			safeReturn === '/' || safeReturn.startsWith('/inventory/')
				? buildScanReturnUrl(safeReturn, toastKind, parsed.data.name)
				: `/inventory/${parsed.data.location}?scan=${toastKind}&scanName=${encodeURIComponent(parsed.data.name)}`;

		redirect(302, target);
	}
};
