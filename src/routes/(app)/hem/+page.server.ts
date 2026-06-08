import { canEditInventory } from '$lib/domain/household';
import { isStorageLocation } from '$lib/domain/location';

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

	const [

		summary,

		engagement,

		celebration,

		receiptAutopilotSuggestions,

		receiptFinishSuggestions,

		savings,

		recentItemNames,

		duplicateGroups,
		activityEvents

	] = await Promise.all([

		locals.inventoryService.getDashboard(householdId),

		locals.gamificationService.getEngagementStrip(householdId, userId),

		locals.gamificationService.detectHomeCelebration(householdId),

		locals.purchasePatternService.getSuggestions(householdId),

		locals.purchasePatternService.getFinishSuggestions(householdId),

		locals.statistikService.getSavingsReport(householdId),

		canWrite ? locals.inventoryService.listRecentItemNames(householdId) : Promise.resolve([]),

		canWrite ? locals.inventoryService.findDuplicateNameGroups(householdId) : Promise.resolve([]),
		locals.pmfService.listRecentHouseholdSyncEvents(householdId, 8)

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

		lastUpdatedByDisplayName

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

