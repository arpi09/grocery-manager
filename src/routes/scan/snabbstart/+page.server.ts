import { redirect } from '@sveltejs/kit';
import { parseScanReturnTo, scanHubHref } from '$lib/utils/scan-nav';
import type { PageServerLoad } from './$types';

/** Legacy route — canonical scan hub lives on `/scan`. */
export const load: PageServerLoad = async ({ url }) => {
	const returnTo = parseScanReturnTo(url.searchParams.get('from'));
	redirect(302, scanHubHref(returnTo));
};
