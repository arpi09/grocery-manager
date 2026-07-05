import { canEditInventory } from '$lib/domain/household';
import type { Locale } from '$lib/i18n/locale';
import type { InventoryIntelligenceService } from '$lib/application/inventory-intelligence.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { peekAutoFillItems, storeAutoFillPending } from '$lib/server/auto-fill-pending';
import { isBrainProactiveEnabled } from '$lib/server/brain-proactive-flag';
import { isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { upcomingDateRange } from '$lib/server/inventory-context';
import { getOpenAiApiKey } from '$lib/server/openai';
import { generateShoppingSuggestions, type ShoppingSuggestion } from '$lib/server/shopping-suggestions';

/**
 * The Söndagsförslaget hero moment is a fresh/short list — that is when the week's
 * list "writes itself". Once the list is already substantial the user is mid-trip,
 * so we stop paying for (and cluttering with) generated suggestions.
 */
const AUTO_FILL_MAX_LIST_ITEMS = 3;

export interface SundayAiSuggestions {
	items: ShoppingSuggestion[];
	note: string | null;
}

/**
 * AI half of Söndagsförslaget: expiring-driven restocks + planned-meal ingredients + staples,
 * each with a free-text reason. Cached in the pending store (1h TTL) so the proposal stays
 * stable across navigations and we call OpenAI at most once per hour per household.
 *
 * Returns null (surface degrades to replenishment-only) when the flag is off, the user can't
 * edit, the list is already full, there is no meaningful signal, or no API key is configured.
 */
export async function loadSundayAiSuggestions(params: {
	householdId: string;
	userId: string;
	role: string | null | undefined;
	locale: Locale;
	uncheckedCount: number;
	inventoryIntelligenceService: InventoryIntelligenceService;
	inventoryService: InventoryService;
	mealPlanService: MealPlanService;
	shoppingListService: ShoppingListService;
	learningFeedbackRepository: ILearningFeedbackRepository;
}): Promise<SundayAiSuggestions | null> {
	if (!isBrainProactiveEnabled()) return null;
	if (isE2eMockAiEnabled()) return null;
	if (!params.role || !canEditInventory(params.role as never)) return null;
	if (params.uncheckedCount >= AUTO_FILL_MAX_LIST_ITEMS) return null;

	const cached = peekAutoFillItems(params.householdId, params.userId);
	if (cached) return cached;

	const intelligence = await params.inventoryIntelligenceService.getHomeIntelligence(
		params.householdId
	);

	// Only spend an AI call when there's real signal — receipt cadence, or planned meals.
	// Generic staple guesses on a blank account would erode trust (trust-over-taps).
	let hasSignal = intelligence.replenishment.length >= 1;
	if (!hasSignal) {
		const { fromDate, toDate } = upcomingDateRange(10);
		const plannedMeals = await params.mealPlanService.listPlannedMealsByRange(
			params.userId,
			fromDate,
			toDate
		);
		hasSignal = plannedMeals.length >= 1;
	}
	if (!hasSignal) return null;

	const apiKey = getOpenAiApiKey();
	if (!apiKey) return null;

	const generated = await generateShoppingSuggestions(
		{
			apiKey,
			householdId: params.householdId,
			userId: params.userId,
			inventoryService: params.inventoryService,
			mealPlanService: params.mealPlanService,
			shoppingListService: params.shoppingListService,
			learningFeedbackRepository: params.learningFeedbackRepository
		},
		{ locale: params.locale, householdSize: 2 }
	);

	if (!generated.ok || generated.items.length === 0) return null;

	storeAutoFillPending({
		householdId: params.householdId,
		userId: params.userId,
		items: generated.items,
		note: generated.note
	});

	return { items: generated.items, note: generated.note };
}
