import { DEFAULT_PLAN_TIER, isProTier } from '$lib/domain/plan';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const userId = locals.user!.id;
	const planTier = locals.planTier ?? DEFAULT_PLAN_TIER;
	const [dashboard, milestones] = await Promise.all([
		locals.statistikService.getDashboard(householdId),
		locals.gamificationService.getMilestones(householdId, userId)
	]);
	return {
		dashboard,
		milestones,
		isPro: isProTier(planTier)
	};
};
