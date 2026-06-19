import type { DashboardSummary } from '$lib/application/inventory.service';
import { canEditInventory } from '$lib/domain/household';
import { isStorageLocation } from '$lib/domain/location';

import type { GamificationCelebrationKind } from '$lib/domain/gamification';

import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';

import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n/locale';

import { translate } from '$lib/i18n/messages';

import {
	createHouseholdAction,
	leaveHouseholdAction,
	switchHouseholdAction
} from '$lib/server/pantry-actions';

import { requireInventoryWriteAccess } from '$lib/server/household-auth';

import { buildReturnUrlWithExpiryNudge } from '$lib/utils/expiry-nudge';

import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { isHomeUxV2Enabled } from '$lib/server/home-ux-v2-flag';

import { itemSchema } from '$lib/validation/inventory.schemas';

import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;

	const degrade = <T>(label: string, fallback: T) => (error: unknown) => {
		console.warn(`[hem] ${label} degraded:`, error);
		return fallback;
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

	const emptyIntelligence: HomeIntelligenceSnapshot = {
		replenishment: [],
		pantryHealth: [],
		waste: null,
		dedupeByKey: {}
	};

	const [
		summary,
		intelligence,
		celebration,
		receiptAutopilotSuggestions,
		receiptFinishSuggestions,
		shoppingListCount,
		shoppingCadence
	] = await Promise.all([
		locals.inventoryService.getDashboard(householdId).catch(degrade('dashboard', emptySummary)),
		locals.inventoryIntelligenceService
			.getHomeIntelligence(householdId)
			.catch(degrade('inventory intelligence', emptyIntelligence)),
		locals.gamificationService
			.detectHomeCelebration(householdId)
			.catch(degrade('celebration', null)),
		locals.purchasePatternService
			.getSuggestions(householdId)
			.catch(degrade('receipt autopilot', [])),
		locals.purchasePatternService
			.getFinishSuggestions(householdId)
			.catch(degrade('receipt finish', [])),
		locals.shoppingListService
			.listUncheckedItems(householdId)
			.then((items) => items.length)
			.catch(degrade('shopping list count', 0)),
		locals.purchasePatternService
			.getHouseholdShoppingCadence(householdId)
			.catch(degrade('shopping cadence', null))
	]);

	const locale: Locale = isLocale(locals.locale) ? locals.locale : DEFAULT_LOCALE;
	const homeUxV2Enabled = isHomeUxV2Enabled();

	return {
		locale,
		pageTitle: translate(locale, homeUxV2Enabled ? 'home.v6.pageTitle' : 'home.title'),
		homeUxV2Enabled,
		summary,
		intelligence,
		celebration: celebration as GamificationCelebrationKind | null,
		canWrite,
		receiptAutopilotSuggestions,
		receiptFinishSuggestions,
		shoppingListCount,
		shoppingCadence,
		showMemoryExplorer: isShelfLifeLearningEnabled()
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
