import { canEditInventory } from '$lib/domain/household';
import { isStorageLocation, type StorageLocation } from '$lib/domain/location';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { receiptLineToInventoryAmount } from '$lib/server/receipt-parse';
import { buildScanReturnUrl } from '$lib/utils/scan-toast';
import { recordProductEvent } from '$lib/server/product-events';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const fromParam = url.searchParams.get('from');
	const returnTo =
		fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : '/';

	if (!locals.householdRole || !canEditInventory(locals.householdRole)) {
		return { returnTo, canWrite: false };
	}

	return { returnTo, canWrite: true };
};

export const actions: Actions = {
	bulkCreate: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		const formData = await event.request.formData();
		const returnToRaw = formData.get('returnTo');
		const returnTo =
			typeof returnToRaw === 'string' &&
			returnToRaw.startsWith('/') &&
			!returnToRaw.startsWith('//')
				? returnToRaw
				: '/';

		const bulkRaw = formData.get('bulkLocation');
		const bulkLocation: StorageLocation =
			typeof bulkRaw === 'string' && isStorageLocation(bulkRaw) ? bulkRaw : 'cupboard';

		const selected = formData
			.getAll('selected')
			.map((v) => Number(v))
			.filter((n) => !Number.isNaN(n));

		if (selected.length === 0) {
			error(400, 'Inga varor valda');
		}

		let created = 0;
		for (const index of selected) {
			const name = formData.get(`name_${index}`);
			if (typeof name !== 'string' || !name.trim()) {
				continue;
			}
			const quantityRaw = formData.get(`quantity_${index}`);
			const unitRaw = formData.get(`unit_${index}`);
			const { quantity, unit } = receiptLineToInventoryAmount({
				name: name.trim(),
				quantity:
					typeof quantityRaw === 'string' && quantityRaw.trim() ? quantityRaw.trim() : undefined,
				unit: typeof unitRaw === 'string' && unitRaw.trim() ? unitRaw.trim() : undefined
			});

			await event.locals.inventoryService.createItem(
				event.locals.householdId!,
				event.locals.user!.id,
				{
					name: name.trim(),
					location: bulkLocation,
					quantity,
					unit,
					expiresOn: null,
					notes: null
				},
				event.locals.householdRole!
			);
			created++;
		}

		const label = `${created} varor`;
		recordProductEvent(event.locals.pmfService, {
			userId: event.locals.user!.id,
			householdId: event.locals.householdId,
			eventType: 'receipt_parsed',
			metadata: { itemsAdded: created }
		});
		const target = buildScanReturnUrl(returnTo, 'added', label);
		redirect(302, target);
	}
};
