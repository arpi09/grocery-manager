import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	let previewExpiringItem: {
		id: string;
		name: string;
		quantity: string;
		unit: string | null;
	} | null = null;

	if (event.locals.householdId) {
		const inventory = await event.locals.inventoryService.listAll(event.locals.householdId);
		const expiring = filterItemsExpiringWithinDays(inventory, EXPIRING_SOON_DAYS);
		const first = expiring[0];
		if (first) {
			previewExpiringItem = {
				id: first.id,
				name: first.name,
				quantity: first.quantity,
				unit: first.unit
			};
		}
	}

	return { previewExpiringItem };
};
