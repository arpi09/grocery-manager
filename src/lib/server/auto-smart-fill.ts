import { canEditInventory } from '$lib/domain/household';
import type { Locale } from '$lib/i18n/locale';
import type { InventoryIntelligenceService } from '$lib/application/inventory-intelligence.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { peekAutoFillPending, storeAutoFillPending } from '$lib/server/auto-fill-pending';
import { isBrainProactiveEnabled } from '$lib/server/brain-proactive-flag';
import { getOpenAiApiKey } from '$lib/server/openai';
import { generateShoppingSuggestions } from '$lib/server/shopping-suggestions';

const AUTO_FILL_MAX_LIST_ITEMS = 3;
const AUTO_FILL_MIN_REPLENISHMENT = 1;

export interface AutoFillPendingView {
	count: number;
	preview: string[];
	note: string | null;
}

export async function loadAutoFillPendingForInkop(params: {
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
}): Promise<AutoFillPendingView | null> {
	if (!isBrainProactiveEnabled()) return null;
	if (!params.role || !canEditInventory(params.role as never)) return null;
	if (params.uncheckedCount >= AUTO_FILL_MAX_LIST_ITEMS) return null;

	const existing = peekAutoFillPending(params.householdId, params.userId);
	if (existing) return existing;

	const intelligence = await params.inventoryIntelligenceService.getHomeIntelligence(
		params.householdId
	);
	if (intelligence.replenishment.length < AUTO_FILL_MIN_REPLENISHMENT) {
		return null;
	}

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

	return peekAutoFillPending(params.householdId, params.userId);
}
