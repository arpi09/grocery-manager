import { canEditInventory } from '$lib/domain/household';
import type { GamificationCelebrationKind } from '$lib/domain/gamification';
import { shouldPromoteWeeklyRitual } from '$lib/domain/weekly-ritual';
import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import {
	createHouseholdAction,
	leaveHouseholdAction,
	switchHouseholdAction
} from '$lib/server/pantry-actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const userId = locals.user!.id;
	const [summary, engagement, celebration, receiptAutopilotSuggestions, savings] = await Promise.all([
		locals.inventoryService.getDashboard(householdId),
		locals.gamificationService.getEngagementStrip(householdId, userId),
		locals.gamificationService.detectZeroWasteCelebration(householdId),
		locals.purchasePatternService.getSuggestions(householdId),
		locals.statistikService.getSavingsReport(householdId)
	]);
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
	const showWeeklyRitual = shouldPromoteWeeklyRitual(summary.expiringSoon.length > 0);
	const locale: Locale = isLocale(locals.locale) ? locals.locale : DEFAULT_LOCALE;
	return {
		locale,
		pageTitle: translate(locale, 'home.title'),
		summary,
		engagement,
		savings,
		showWeeklyRitual,
		celebration: celebration as GamificationCelebrationKind | null,
		canWrite,
		receiptAutopilotSuggestions
	};
};

export const actions: Actions = {
	switchHousehold: switchHouseholdAction,
	createHousehold: createHouseholdAction,
	leaveHousehold: leaveHouseholdAction
};
