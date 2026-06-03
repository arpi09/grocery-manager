import { redirect } from '@sveltejs/kit';
import { scanModeHref } from '$lib/utils/scan-nav';
import type { PageServerLoad } from './$types';

/** Legacy route — canonical scan receipt mode lives on `/scan?mode=receipt`. */
export const load: PageServerLoad = async ({ url }) => {
	const fromParam = url.searchParams.get('from');
	const returnTo =
		fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : '/';
	redirect(302, scanModeHref('receipt', returnTo));
};
