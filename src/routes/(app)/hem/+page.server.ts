import type { EngagementStrip } from '$lib/application/gamification.service';
import type { DashboardSummary } from '$lib/application/inventory.service';
import { canEditInventory } from '$lib/domain/household';
import { isStorageLocation } from '$lib/domain/location';
import type { SavingsReport } from '$lib/domain/savings-estimate';

import type { GamificationCelebrationKind } from '$lib/domain/gamification';

import { shouldPromoteWeeklyRitual } from '$lib/domain/weekly-ritual';

import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n/locale';

import { translate } from '$lib/i18n/messages';

import {

	createHouseholdAction,

	leaveHouseholdAction,

	switchHouseholdAction

} from '$lib/server/pantry-actions';

import { requireInventoryWriteAccess } from '$lib/server/household-auth';

import { buildReturnUrlWithExpiryNudge } from '$lib/utils/expiry-nudge';

import { itemSchema } from '$lib/validation/inventory.schemas';

import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';



export const load: PageServerLoad = async ({ locals }) => {

	const householdId = locals.householdId!;

	const userId = locals.user!.id;

	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;

	const degrade = <T>(label: string, fallback: T) => (error: unknown) => {
		console.warn(`[hem] ${label} degraded:`, error);
		return fallback;
	};

	const emptyEngagement: EngagementStrip = {
		hasConsumptionData: false,
		consumedThisWeek: null,
		zeroWasteWeeks: null,
		eatFirst: { suggestionsThisWeek: 0, mealsScheduledThisWeek: 0, goal: 3, complete: false },
		nextMilestone: null,
		syncWeekWrites: 0,
		bridgeCheckoffsThisWeek: 0
	};

	const emptySavings: SavingsReport = {
		hasData: false,
		consumedCount: 0,
		wastedCount: 0,
		savedSek: 0,
		savedKg: 0,
		wastedSek: 0,
		wastedKg: 0,
		netSek: 0
	};

	const emptySummary: DashboardSummary = {
		counts: [],
		expiringSoon: [],
		totalItems: 0,
		pantryStatus: {
			withoutExpiryCount: 0,
			autoExpiredCount: 0,
			staleCount: 0,
			lastUpdatedAt: null,
			lastUpdatedByUserId: null,
			syncHealth: 'good'
		}
	};

	const [

		summary,

		engagement,

		celebration,

		receiptAutopilotSuggestions,

		receiptFinishSuggestions,

		savings,

		recentItemNames,

		duplicateGroups,
		activityEvents,
		shoppingListCount

	] = await Promise.all([

		locals.inventoryService.getDashboard(householdId).catch(degrade('dashboard', emptySummary)),

		locals.gamificationService
			.getEngagementStrip(householdId, userId)
			.catch(degrade('engagement strip', emptyEngagement)),

		locals.gamificationService
			.detectHomeCelebration(householdId)
			.catch(degrade('celebration', null)),

		locals.purchasePatternService
			.getSuggestions(householdId)
			.catch(degrade('receipt autopilot', [])),

		locals.purchasePatternService
			.getFinishSuggestions(householdId)
			.catch(degrade('receipt finish', [])),

		locals.statistikService.getSavingsReport(householdId).catch(degrade('savings', emptySavings)),

		canWrite
			? locals.inventoryService.listRecentItemNames(householdId).catch(degrade('recent names', []))
			: Promise.resolve([]),

		canWrite
			? locals.inventoryService
					.findDuplicateNameGroups(householdId)
					.catch(degrade('duplicate groups', []))
			: Promise.resolve([]),
		locals.pmfService.listRecentHouseholdSyncEvents(householdId, 8).catch(degrade('activity feed', [])),
		locals.shoppingListService
			.listUncheckedItems(householdId)
			.then((items) => items.length)
			.catch(degrade('shopping list count', 0))

	]);



	let lastUpdatedByDisplayName: string | null = null;

	const lastUpdaterId = summary.pantryStatus.lastUpdatedByUserId;

	if (lastUpdaterId) {

		try {

			const profile = await locals.profileService.getProfile(lastUpdaterId);

			lastUpdatedByDisplayName = profile.displayName?.trim() || null;

		} catch {

			lastUpdatedByDisplayName = null;

		}

	}



	const syncNudgeCount = summary.pantryStatus.staleCount + summary.pantryStatus.autoExpiredCount;

	const showWeeklyRitual = shouldPromoteWeeklyRitual(

		summary.expiringSoon.length > 0,

		syncNudgeCount

	);

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

		receiptAutopilotSuggestions,

		receiptFinishSuggestions,

		recentItemNames: recentItemNames.slice(0, 5),

		duplicateGroups,
		activityEvents,

		lastUpdatedByDisplayName,

		shoppingListCount

	};

};



export const actions: Actions = {

	switchHousehold: switchHouseholdAction,

	createHousehold: createHouseholdAction,

	leaveHousehold: leaveHouseholdAction,

	quickAdd: async ({ request, locals }) => {

		requireInventoryWriteAccess(locals.householdRole);

		const formData = await request.formData();

		const locationRaw = formData.get('location');
		const location = typeof locationRaw === 'string' && isStorageLocation(locationRaw) ? locationRaw : 'fridge';
		const parsed = itemSchema.safeParse({

			name: formData.get('name'),

			location,

			quantity: '1',

			unit: undefined,

			expiresOn: undefined,

			notes: undefined

		});

		if (!parsed.success) {

			return fail(400, { quickAddErrors: parsed.error.flatten().fieldErrors });

		}



		const created = await locals.inventoryService.createItem(

			locals.householdId!,

			locals.user!.id,

			{

				name: parsed.data.name,

				location,

				quantity: '1',

				unit: null,

				expiresOn: null,

				notes: null,

				inferExpiry: true

			},

			locals.householdRole!

		);



		const returnTo = created.expiresOn

			? '/hem'

			: buildReturnUrlWithExpiryNudge('/hem', created.id, created.name);

		redirect(302, returnTo);

	}

};

