import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const dashboard = await locals.statistikService.getDashboard(locals.householdId!);
	return { dashboard };
};
