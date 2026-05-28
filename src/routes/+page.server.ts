import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const summary = await locals.inventoryService.getDashboard(locals.householdId!);
	return { summary };
};
