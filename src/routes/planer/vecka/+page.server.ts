import { canEditInventory } from '$lib/domain/household';
import { parseEatFirstWeekInboundSource } from '$lib/domain/eat-first-week';
import { toIsoDate } from '$lib/domain/statistik';
import { getForwardMealDatePool, getWeekDateRange } from '$lib/domain/weekly-ritual';
import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { recordProductEvent } from '$lib/server/product-events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const householdId = locals.householdId!;
	const userId = locals.user!.id;
	const referenceDate = new Date();
	const weekRange = getWeekDateRange(referenceDate);
	const todayIso = toIsoDate(referenceDate);
	const planningDates = getForwardMealDatePool(referenceDate);
	const locale: Locale = isLocale(locals.locale) ? locals.locale : DEFAULT_LOCALE;

	const [dashboard, savings, plannedMealsThisWeek] = await Promise.all([
		locals.inventoryService.getDashboard(householdId),
		locals.statistikService.getSavingsReport(householdId),
		locals.mealPlanService.listPlannedMealsByRange(userId, weekRange.from, weekRange.to)
	]);

	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
	const inboundSource = parseEatFirstWeekInboundSource(url.searchParams.get('from'));
	const expiringCount = dashboard.expiringSoon.length;

	recordProductEvent(locals.pmfService, {
		userId,
		householdId,
		eventType: 'eat_first_week_viewed',
		metadata: {
			expiringCount,
			inboundSource: inboundSource ?? 'direct'
		}
	});

	return {
		locale,
		pageTitle: translate(locale, 'weeklyRitual.pageTitle'),
		expiringSoon: dashboard.expiringSoon,
		weekDates: weekRange.dates,
		planningDates,
		todayIso,
		plannedMealsThisWeek: plannedMealsThisWeek.map((meal) => ({
			id: meal.id,
			title: meal.title,
			plannedDate: meal.plannedDate
		})),
		savings,
		canWrite,
		inboundSource,
		expiringCount
	};
};
