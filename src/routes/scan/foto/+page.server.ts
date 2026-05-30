import { isStorageLocation } from '$lib/domain/location';
import { canEditInventory } from '$lib/domain/household';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;

	const locationParam = url.searchParams.get('location');
	const fromParam = url.searchParams.get('from');
	const defaultLocation =
		locationParam && isStorageLocation(locationParam) ? locationParam : 'fridge';
	const returnTo =
		fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : '/';

	return { defaultLocation, returnTo, canWrite };
};
