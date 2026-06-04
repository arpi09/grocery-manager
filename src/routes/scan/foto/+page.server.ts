import { isStorageLocation } from '$lib/domain/location';
import { redirect } from '@sveltejs/kit';
import { parseScanReturnTo, scanModeHref } from '$lib/utils/scan-nav';
import type { PageServerLoad } from './$types';

/** Legacy route — canonical photo round lives on `/scan?mode=photo`. */
export const load: PageServerLoad = async ({ url }) => {
	const locationParam = url.searchParams.get('location');
	const returnTo = parseScanReturnTo(url.searchParams.get('from'));
	const location =
		locationParam && isStorageLocation(locationParam) ? locationParam : undefined;

	redirect(302, scanModeHref('photo', returnTo, location ? { location } : undefined));
};
