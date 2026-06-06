import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const householdId = locals.householdId!;
	const userId = locals.user!.id;
	const month = url.searchParams.get('month');
	const report = await locals.wrappedService.buildMonthlyReport(householdId, userId, month);
	return { report };
};
