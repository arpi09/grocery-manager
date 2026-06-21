import { DEFAULT_PLAN_TIER, isProTier } from '$lib/domain/plan';
import { previousReportMonth } from '$lib/marketing/linkedin-draft-defaults';
import { skaffurapportService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const userId = locals.user!.id;
	const planTier = locals.planTier ?? DEFAULT_PLAN_TIER;
	const reportMonth = previousReportMonth();
	const [dashboard, milestones, publishedReport] = await Promise.all([
		locals.statistikService.getDashboard(householdId, userId),
		locals.gamificationService.getMilestones(householdId, userId),
		skaffurapportService.getPublishedReport(reportMonth)
	]);

	const rapportLink =
		publishedReport?.meetsKAnonymity === true
			? { month: reportMonth, href: `/rapport/${reportMonth}` }
			: null;

	return {
		dashboard,
		milestones,
		isPro: isProTier(planTier),
		rapportLink
	};
};
