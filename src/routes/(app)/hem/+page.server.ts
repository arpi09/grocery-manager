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
import { isHomeBriefingAiEnabled } from '$lib/server/feature-flags';
import { generateHomeBriefingOneLiner } from '$lib/server/home-briefing-one-liner';
import { getOpenAiApiKey } from '$lib/server/openai';
import { rankReplenishmentWithFeedback } from '$lib/server/replenishment-rank';
import { learningFeedbackRepository } from '$lib/server/di';
import {
	buildHomeBriefingRecipeCard,
	pickBriefingRecipeIdea
} from '$lib/domain/home-briefing-recipe';
import type { HomeBriefingRecipeCard, HomeBriefingFunFact } from '$lib/domain/home-briefing';
import { selectHomeBriefingFunFact } from '$lib/domain/home-briefing';
import { isWithinActiveMealSlot } from '$lib/domain/meal-slot';

import { itemSchema } from '$lib/validation/inventory.schemas';

import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const householdId = locals.householdId!;
	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
	const homeUxV2Enabled = isHomeUxV2Enabled();

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

	let loadFailed = false;
	const locale: Locale = isLocale(locals.locale) ? locals.locale : DEFAULT_LOCALE;

	const summaryPromise = locals.inventoryService.getDashboard(householdId).catch((error) => {
		if (homeUxV2Enabled) {
			loadFailed = true;
		}
		return degrade('dashboard', emptySummary)(error);
	});

	const intelligencePromise = locals.inventoryIntelligenceService
		.getHomeIntelligence(householdId)
		.catch((error) => {
			if (homeUxV2Enabled) {
				loadFailed = true;
			}
			return degrade('inventory intelligence', emptyIntelligence)(error);
		});

	const [
		summary,
		intelligence,
		celebration,
		receiptAutopilotSuggestions,
		receiptFinishSuggestions,
		shoppingListCount,
		shoppingCadence
	] = await Promise.all([
		summaryPromise,
		intelligencePromise,
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

	intelligence.replenishment = await rankReplenishmentWithFeedback(intelligence.replenishment, {
		householdId,
		locale,
		learningFeedbackRepository,
		apiKey: getOpenAiApiKey()
	});

	let briefingOneLiner: string | null = null;
	let recipeSuggestion: HomeBriefingRecipeCard | null = null;
	let briefingRecipeChip: { id: string; title: string } | null = null;
	let briefingFunFact: HomeBriefingFunFact | null = null;

	if (homeUxV2Enabled && !loadFailed) {
		const impactPromise = locals.statistikService
			.getImpact(householdId)
			.then((impact) => selectHomeBriefingFunFact(impact))
			.catch((error) => {
				console.warn('[hem] fun fact degraded:', error);
				return null;
			});

		if (isHomeBriefingAiEnabled()) {
			const apiKey = getOpenAiApiKey();
			if (apiKey) {
				try {
					briefingOneLiner = await generateHomeBriefingOneLiner(
						apiKey,
						summary,
						intelligence,
						locale,
						shoppingListCount
					);
				} catch (error) {
					console.warn('[hem] briefing one-liner degraded:', error);
				}
			}
		}

		if (locals.user) {
			try {
				const ideas = await locals.mealPlanService.listRecipeIdeas(locals.user.id, 6);
				const showRecipeOnHome =
					summary.expiringSoon.length > 0 || isWithinActiveMealSlot();
				if (ideas.length > 0 && showRecipeOnHome) {
					briefingRecipeChip = { id: ideas[0].id, title: ideas[0].title };
				}
				const idea = pickBriefingRecipeIdea(ideas, summary.expiringSoon);
				if (idea) {
					recipeSuggestion = buildHomeBriefingRecipeCard(
						idea,
						summary.expiringSoon,
						shoppingCadence,
						locale
					);
				}
			} catch (error) {
				console.warn('[hem] recipe briefing degraded:', error);
			}
		}

		briefingFunFact = await impactPromise;
	}

	return {
		locale,
		pageTitle: translate(locale, homeUxV2Enabled ? 'home.v6.pageTitle' : 'home.title'),
		homeUxV2Enabled,
		loadFailed: homeUxV2Enabled ? loadFailed : false,
		summary,
		intelligence,
		celebration: celebration as GamificationCelebrationKind | null,
		canWrite,
		receiptAutopilotSuggestions,
		receiptFinishSuggestions,
		shoppingListCount,
		shoppingCadence,
		recipeSuggestion,
		briefingRecipeChip,
		briefingFunFact,
		briefingOneLiner,
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
