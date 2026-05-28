import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const analytics = await locals.inventoryService.getAnalytics(locals.householdId!);
	return { analytics };
};
