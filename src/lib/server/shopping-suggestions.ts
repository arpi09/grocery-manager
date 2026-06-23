import type { CreateShoppingListItemInput } from '$lib/domain/shopping-list-item';
import {
	formatInventoryLines,
	formatPlannedMealLines,
	formatRecipeIdeaLines,
	formatShoppingListLines,
	formatUrgentInventoryBlock,
	upcomingDateRange
} from '$lib/server/inventory-context';
import type { MessageKey } from '$lib/i18n/messages';
import {
	estimateInputTokens,
	normalizePromptLocale,
	PROMPT_VERSION_SHOPPING,
	promptLocaleInstruction
} from '$lib/server/ai-prompt-shared';
import { OPENAI_MODEL_NANO, requestStructuredJson } from '$lib/server/openai';
import { logBrainMetrics } from '$lib/server/brain-metrics';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';

export const SHOPPING_CATEGORIES = [
	'Frukt & grönt',
	'Mejeri',
	'Kött & chark',
	'Fisk & skaldjur',
	'Bröd & bakverk',
	'Skafferi',
	'Dryck',
	'Fryst',
	'Övrigt'
] as const;

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

export interface ShoppingSuggestion {
	name: string;
	quantity: string;
	category: ShoppingCategory;
	reason: string;
	priority: 'high' | 'medium' | 'low';
	relatedMealDate?: string | null;
	relatedRecipeTitle?: string | null;
}

export const SHOPPING_SUGGESTIONS_SCHEMA = {
	type: 'object',
	properties: {
		note: { type: 'string' },
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					quantity: { type: 'string' },
					category: { type: 'string', enum: [...SHOPPING_CATEGORIES] },
					reason: { type: 'string' },
					priority: { type: 'string', enum: ['high', 'medium', 'low'] },
					relatedMealDate: { type: ['string', 'null'] },
					relatedRecipeTitle: { type: ['string', 'null'] }
				},
				required: ['name', 'quantity', 'category', 'reason', 'priority', 'relatedMealDate', 'relatedRecipeTitle'],
				additionalProperties: false
			}
		}
	},
	required: ['note', 'items'],
	additionalProperties: false
} as const;

function parseCategory(value: unknown): ShoppingCategory {
	if (typeof value === 'string' && SHOPPING_CATEGORIES.includes(value as ShoppingCategory)) {
		return value as ShoppingCategory;
	}
	return 'Övrigt';
}

export function parseShoppingSuggestions(input: unknown): ShoppingSuggestion[] {
	if (!input || typeof input !== 'object') {
		return [];
	}

	const items = (input as { items?: unknown }).items;
	if (!Array.isArray(items)) {
		return [];
	}

	return items
		.map((row) => {
			if (!row || typeof row !== 'object') {
				return null;
			}
			const candidate = row as Record<string, unknown>;
			const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
			const quantity = typeof candidate.quantity === 'string' ? candidate.quantity.trim() : '';
			const reason = typeof candidate.reason === 'string' ? candidate.reason.trim() : '';
			const priority: ShoppingSuggestion['priority'] =
				candidate.priority === 'high' || candidate.priority === 'low' || candidate.priority === 'medium'
					? candidate.priority
					: 'medium';

			if (!name || !quantity || !reason) {
				return null;
			}

			const parsed: ShoppingSuggestion = {
				name,
				quantity,
				category: parseCategory(candidate.category),
				reason,
				priority,
				relatedMealDate:
					typeof candidate.relatedMealDate === 'string' ? candidate.relatedMealDate.trim() || null : null,
				relatedRecipeTitle:
					typeof candidate.relatedRecipeTitle === 'string'
						? candidate.relatedRecipeTitle.trim() || null
						: null
			};
			return parsed;
		})
		.filter((item): item is ShoppingSuggestion => item !== null)
		.slice(0, 24);
}

export function parseShoppingSuggestionNote(input: unknown): string | null {
	if (!input || typeof input !== 'object') {
		return null;
	}
	const note = (input as { note?: unknown }).note;
	return typeof note === 'string' && note.trim() ? note.trim() : null;
}

/** Splits AI quantity strings like "1 st" / "500 g" into DB numeric + unit. */
export function parseSuggestionQuantity(raw: string): {
	quantity: string | null;
	unit: string | null;
} {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { quantity: null, unit: null };
	}

	const match = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/u);
	if (match) {
		const quantity = match[1].replace(',', '.');
		const unit = match[2].trim() || null;
		return { quantity, unit };
	}

	if (/^\d+(?:[.,]\d+)?$/u.test(trimmed)) {
		return { quantity: trimmed.replace(',', '.'), unit: null };
	}

	return { quantity: null, unit: trimmed };
}

export function suggestionToListItem(suggestion: ShoppingSuggestion): CreateShoppingListItemInput {
	const { quantity, unit } = parseSuggestionQuantity(suggestion.quantity);
	return {
		name: suggestion.name,
		quantity,
		unit
	};
}

export function normalizeShoppingItemName(name: string): string {
	return name.trim().toLowerCase();
}

export interface GenerateShoppingSuggestionsInput {
	preferences?: string;
	householdSize?: number;
	locale?: string;
}

export interface GenerateShoppingSuggestionsDeps {
	apiKey: string;
	householdId: string;
	userId: string;
	inventoryService: InventoryService;
	mealPlanService: MealPlanService;
	shoppingListService: ShoppingListService;
}

export type GenerateShoppingSuggestionsResult =
	| { ok: true; items: ShoppingSuggestion[]; note: string | null }
	| { ok: false; status: number; messageKey: MessageKey };

export async function generateShoppingSuggestions(
	deps: GenerateShoppingSuggestionsDeps,
	input: GenerateShoppingSuggestionsInput
): Promise<GenerateShoppingSuggestionsResult> {
	const preferences =
		typeof input.preferences === 'string' ? input.preferences.trim().slice(0, 300) : '';
	const householdSize =
		typeof input.householdSize === 'number' &&
		input.householdSize >= 1 &&
		input.householdSize <= 8
			? Math.round(input.householdSize)
			: 2;

	const locale = normalizePromptLocale(input.locale ?? 'sv');

	const inventory = await deps.inventoryService.listAll(deps.householdId);
	const { fromDate, toDate } = upcomingDateRange(10);
	const [plannedMeals, recipeIdeas, shoppingList] = await Promise.all([
		deps.mealPlanService.listPlannedMealsByRange(deps.userId, fromDate, toDate),
		deps.mealPlanService.listRecipeIdeas(deps.userId, 8),
		deps.shoppingListService.listUncheckedItems(deps.householdId)
	]);

	const inventoryLabel =
		locale === 'en'
			? 'Current inventory (do NOT suggest items already well stocked):'
			: 'Aktuellt lager (föreslå INTE varor som redan finns i tillräcklig mängd):';
	const urgentLabel =
		locale === 'en'
			? 'Expiring within 5 days (prioritize restocking related staples):'
			: 'Går ut inom 5 dagar (prioritera kompletterande inköp):';
	const shoppingListLabel =
		locale === 'en'
			? 'Current shopping list (do NOT duplicate):'
			: 'Aktuell inköpslista (duplicera INTE):';
	const mealsLabel =
		locale === 'en'
			? `Planned meals (${fromDate} to ${toDate}):`
			: `Planerade måltider (${fromDate} till ${toDate}):`;
	const ideasLabel =
		locale === 'en'
			? 'Recipe ideas (use missingIngredients heavily):'
			: 'Receptidéer (prioritera missingIngredients):';
	const householdLabel = locale === 'en' ? 'Household size' : 'Hushållsstorlek';
	const preferencesLabel = locale === 'en' ? 'Shopping preferences' : 'Inköpspreferenser';

	const userPrompt = [
		inventoryLabel,
		formatInventoryLines(inventory, locale),
		'',
		urgentLabel,
		formatUrgentInventoryBlock(inventory, locale),
		'',
		shoppingListLabel,
		formatShoppingListLines(shoppingList, locale),
		'',
		mealsLabel,
		formatPlannedMealLines(plannedMeals, locale),
		'',
		ideasLabel,
		formatRecipeIdeaLines(recipeIdeas, locale),
		'',
		`${householdLabel}: ${householdSize} ${locale === 'en' ? 'people' : 'personer'}`,
		preferences ? `${preferencesLabel}: ${preferences}` : ''
	]
		.filter(Boolean)
		.join('\n');

	const systemPrompt = [
		locale === 'en'
			? 'You build a practical Swedish home shopping list based on pantry inventory.'
			: 'Du bygger en praktisk svensk inköpslista utifrån skafferilager.',
		promptLocaleInstruction(locale),
		'Product names must be common Swedish grocery terms (brand optional, realistic sizes).',
		'Suggest items that are missing, running low, needed for planned meals, or common staples worth restocking.',
		'Do not duplicate what the user clearly already has in sufficient quantity or on the shopping list.',
		'Do NOT suggest restocking when inventory still shows a meaningful amount left after partial use.',
		'Group mentally by grocery store departments.',
		locale === 'en'
			? 'Respond in English for name, quantity, and reason.'
			: 'Respond in Swedish for name, quantity, and reason.',
		'Return JSON only:',
		'{"note":"","items":[{"name":"","quantity":"","category":"Frukt & grönt|Mejeri|Kött & chark|Fisk & skaldjur|Bröd & bakverk|Skafferi|Dryck|Fryst|Övrigt","reason":"","priority":"high|medium|low","relatedMealDate":null,"relatedRecipeTitle":null}]}',
		'Rules:',
		'- 6 to 20 items, prioritized for one shopping trip',
		'- relatedMealDate: YYYY-MM-DD when tied to a planned meal, else null',
		'- relatedRecipeTitle: recipe title when tied to a recipe idea, else null',
		'- note: optional short shopping tip (can be empty string)',
		`- promptVersion: ${PROMPT_VERSION_SHOPPING}`,
		'- quantity examples: "1 st", "500 g", "2 förpackningar"',
		'- no markdown code fences'
	].join('\n');

	const result = await requestStructuredJson(deps.apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt,
		userPrompt,
		schemaName: 'shopping_suggestions',
		schema: SHOPPING_SUGGESTIONS_SCHEMA
	});

	if (!result.ok) {
		return { ok: false, status: result.status, messageKey: result.messageKey };
	}

	logBrainMetrics('shopping_suggestions', {
		source: 'shopping_suggestions',
		promptVersion: PROMPT_VERSION_SHOPPING,
		inputTokenEstimate: estimateInputTokens(userPrompt, inventory.length)
	});

	const items = parseShoppingSuggestions(result.data);
	if (items.length === 0) {
		return { ok: false, status: 502, messageKey: 'errors.api.suggestionsFailed' };
	}

	return {
		ok: true,
		items,
		note: parseShoppingSuggestionNote(result.data)
	};
}
