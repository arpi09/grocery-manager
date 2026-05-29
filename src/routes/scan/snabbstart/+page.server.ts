import starterItems from '$lib/data/starter-pack.json';
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

	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;

	return { returnTo, canWrite, items: starterItems };
};

export const actions: Actions = {
	bulkCreate: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		const formData = await event.request.formData();
		const defaultRaw = formData.get('defaultLocation');
		const defaultLocation: StorageLocation =
			typeof defaultRaw === 'string' && isStorageLocation(defaultRaw) ? defaultRaw : 'cupboard';

		const selected = formData
			.getAll('selected')
			.map((v) => Number(v))
			.filter((n) => !Number.isNaN(n));

		if (selected.length === 0) {
			error(400, 'Inga varor valda');
		}

		const items = starterItems as { name: string; location: StorageLocation }[];
		let created = 0;
		let lastLocation = defaultLocation;

		for (const index of selected) {
			const item = items[index];
			if (!item?.name) {
				continue;
			}
			const useDefault = formData.get(`useDefault_${index}`) === '1';
			const location = useDefault ? defaultLocation : item.location;
			lastLocation = location;

			await event.locals.inventoryService.createItem(
				event.locals.householdId!,
				event.locals.user!.id,
				{
					name: item.name,
					location,
					quantity: '1',
					unit: null,
					expiresOn: null,
					notes: null
				},
				event.locals.householdRole!
			);
			created++;
		}

		const target = buildScanReturnUrl(`/inventory/${lastLocation}`, 'added', `${created} varor`);
		redirect(302, target);
	}
};
