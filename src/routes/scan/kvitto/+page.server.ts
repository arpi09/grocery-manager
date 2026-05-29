import { canEditInventory } from '$lib/domain/household';
import { isStorageLocation, type StorageLocation } from '$lib/domain/location';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { buildScanReturnUrl } from '$lib/utils/scan-toast';
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
			const quantity =
				typeof quantityRaw === 'string' && quantityRaw.trim() ? quantityRaw.trim() : '1';

			await event.locals.inventoryService.createItem(
				event.locals.householdId!,
				event.locals.user!.id,
				{
					name: name.trim(),
					location: bulkLocation,
					quantity,
					unit: null,
					expiresOn: null,
					notes: null
				},
				event.locals.householdRole!
			);
			created++;
		}

		const label = `${created} varor`;
		const target = buildScanReturnUrl(`/inventory/${bulkLocation}`, 'added', label);
		redirect(302, target);
	}
};
