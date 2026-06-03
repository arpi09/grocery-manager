import { redirect } from '@sveltejs/kit';
import { parseScanReturnTo, scanModeHref } from '$lib/utils/scan-nav';
import type { PageServerLoad } from './$types';

/** Legacy route — canonical scan receipt mode lives on `/scan?mode=receipt`. */
export const load: PageServerLoad = async ({ url }) => {
	const returnTo = parseScanReturnTo(url.searchParams.get('from'));
	redirect(302, scanModeHref('receipt', returnTo));
};
