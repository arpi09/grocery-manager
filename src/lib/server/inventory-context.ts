import type { InventoryItem } from '$lib/domain/inventory-item';
import { isItemFinished } from '$lib/domain/inventory-item';
import { daysUntilExpiry } from '$lib/domain/expiry';
import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import type { StorageLocation } from '$lib/domain/location';
import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';
import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
import { PROMPT_INVENTORY_ROW_CAP } from '$lib/server/ai-prompt-shared';

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export type PromptLocale = 'sv' | 'en';

export interface StructuredInventoryRow {
	id: string;
	name: string;
	quantity: string;
	unit: string | null;
	location: StorageLocation;
	daysUntilExpiry: number | null;
	expiresOn: string | null;
	expiresOnSource: string | null;
	typicalPortionUse: number | null;
	notes: string | null;
}

export interface StructuredInventoryPayload {
	inventory: StructuredInventoryRow[];
	truncated: { omittedCount: number; note: string } | null;
	lines: string;
	truncatedNote: string | null;
	rowCount: number;
	omittedCount: number;
}

export interface VelocityHintRow {
	displayName: string;
	location: StorageLocation;
	typicalDays: number;
	sampleCount: number;
}

export interface FormatStructuredInventoryOptions {
	cap?: number;
	portions?: number;
}

function typicalPortionUse(stock: number, portions: number): number {
	const perPortion = stock / Math.max(portions, 1);
	return Math.max(Math.min(perPortion * 0.35, stock * 0.25), stock * 0.05);
}

function inventoryUrgencyScore(item: InventoryItem): number {
	if (!item.expiresOn) {
		return isEstimatedExpirySource(item.expiresOnSource) ? 9000 : 8000;
	}
	const days = daysUntilExpiry(item.expiresOn);
	const estimatedPenalty = isEstimatedExpirySource(item.expiresOnSource) ? 0.5 : 0;
	return days + estimatedPenalty;
}

/** Sort by expiry urgency (soonest first), then prefer verified expiry sources. */
export function sortInventoryByUrgency(items: InventoryItem[]): InventoryItem[] {
	return [...items].sort((a, b) => inventoryUrgencyScore(a) - inventoryUrgencyScore(b));
}

function toStructuredRow(
	item: InventoryItem,
	locale: PromptLocale,
	portions: number
): StructuredInventoryRow {
	const stock = parseNumericQuantity(item.quantity);
	const unit = item.unit;
	return {
		id: item.id,
		name: item.name,
		quantity: item.quantity,
		unit,
		location: item.location,
		daysUntilExpiry: item.expiresOn ? daysUntilExpiry(item.expiresOn) : null,
		expiresOn: item.expiresOn,
		expiresOnSource: item.expiresOnSource,
		typicalPortionUse: stock !== null ? typicalPortionUse(stock, portions) : null,
		notes: item.notes
	};
}

function formatInventoryLine(row: StructuredInventoryRow, locale: PromptLocale): string {
	const unit = row.unit ? ` ${row.unit}` : '';
	const notes = row.notes
		? locale === 'en'
			? `, notes: ${row.notes}`
			: `, anteckning: ${row.notes}`
		: '';
	const sourceSuffix = row.expiresOnSource ? ` (${row.expiresOnSource})` : '';
	const portionHint =
		row.typicalPortionUse != null
			? locale === 'en'
				? `, typical meal use ~${Math.round(row.typicalPortionUse)}${unit}`
				: `, typisk måltidsmängd ca ${Math.round(row.typicalPortionUse)}${unit}`
			: '';

	if (locale === 'en') {
		const expiry =
			row.daysUntilExpiry != null
				? `, expires in ${row.daysUntilExpiry}d`
				: row.expiresOn
					? `, expires ${row.expiresOn}`
					: '';
		return `- [${row.id}] ${row.name}: ${row.quantity}${unit} (${row.location})${portionHint}${expiry}${sourceSuffix}${notes}`;
	}

	const expiry =
		row.daysUntilExpiry != null
			? `, utgår om ${row.daysUntilExpiry} d`
			: row.expiresOn
				? `, utgår ${row.expiresOn}`
				: '';
	return `- [${row.id}] ${row.name}: ${row.quantity}${unit} (${row.location})${portionHint}${expiry}${sourceSuffix}${notes}`;
}

export function formatStructuredInventoryPayload(
	items: InventoryItem[],
	locale: PromptLocale = 'sv',
	options: FormatStructuredInventoryOptions = {}
): StructuredInventoryPayload {
	const cap = options.cap ?? PROMPT_INVENTORY_ROW_CAP;
	const portions = options.portions ?? 4;
	const active = sortInventoryByUrgency(items.filter((item) => !isItemFinished(item)));
	const capped = active.slice(0, cap);
	const omittedCount = Math.max(0, active.length - capped.length);
	const inventory = capped.map((item) => toStructuredRow(item, locale, portions));

	const emptyLabel = locale === 'en' ? '(empty inventory)' : '(tomt lager)';
	if (inventory.length === 0) {
		return {
			inventory: [],
			truncated: null,
			lines: emptyLabel,
			truncatedNote: null,
			rowCount: 0,
			omittedCount: 0
		};
	}

	const truncatedNote =
		omittedCount > 0
			? locale === 'en'
				? `+${omittedCount} more (lowest urgency omitted)`
				: `+${omittedCount} fler (lägst urgency ej med)`
			: null;

	const lines = inventory.map((row) => formatInventoryLine(row, locale)).join('\n');
	const linesWithSuffix = lines + (truncatedNote ? `\n${truncatedNote}` : '');

	return {
		inventory,
		truncated:
			omittedCount > 0
				? {
						omittedCount,
						note:
							locale === 'en'
								? `${omittedCount} lowest-urgency items omitted`
								: `${omittedCount} varor med lägst urgency utelämnade`
					}
				: null,
		lines: linesWithSuffix,
		truncatedNote,
		rowCount: inventory.length,
		omittedCount
	};
}

export function formatInventoryLines(
	items: InventoryItem[],
	locale: PromptLocale = 'sv',
	options?: FormatStructuredInventoryOptions
): string {
	return formatStructuredInventoryPayload(items, locale, options).lines;
}

export function formatUrgentInventoryBlock(
	items: InventoryItem[],
	locale: PromptLocale = 'sv',
	withinDays = 5
): string {
	const urgent = sortInventoryByUrgency(items.filter((item) => !isItemFinished(item))).filter(
		(item) => item.expiresOn && (daysUntilExpiry(item.expiresOn) ?? 99) <= withinDays
	);

	if (urgent.length === 0) {
		return locale === 'en'
			? '(no items expiring within 5 days)'
			: '(inga varor som går ut inom 5 dagar)';
	}

	return formatStructuredInventoryPayload(urgent, locale).lines;
}

export function formatShoppingListLines(items: ShoppingListItem[], locale: PromptLocale = 'sv'): string {
	const unchecked = items.filter((item) => !item.checked);
	if (unchecked.length === 0) {
		return locale === 'en' ? '(empty shopping list)' : '(tom inköpslista)';
	}

	return unchecked
		.map((item) => {
			const unit = item.unit ? ` ${item.unit}` : '';
			const qty = item.quantity ? `${item.quantity}${unit}` : '';
			return qty ? `- ${item.name}: ${qty}` : `- ${item.name}`;
		})
		.join('\n');
}

export function formatPlannedMealLines(meals: PlannedMeal[], locale: PromptLocale = 'sv'): string {
	if (meals.length === 0) {
		return locale === 'en' ? '(no planned meals in range)' : '(inga planerade måltider i intervallet)';
	}

	return meals
		.map((meal) => {
			const notes = meal.notes ? ` — ${meal.notes}` : '';
			return `- ${meal.plannedDate}: ${meal.title}${notes}`;
		})
		.join('\n');
}

export function formatRecipeIdeaLines(ideas: RecipeIdea[], locale: PromptLocale = 'sv'): string {
	if (ideas.length === 0) {
		return locale === 'en' ? '(no saved recipe ideas)' : '(inga sparade receptidéer)';
	}

	const missingLabel = locale === 'en' ? 'missing' : 'saknas';
	const useLabel = locale === 'en' ? 'use' : 'använd';

	return ideas
		.map((idea) => {
			const missing =
				idea.missingIngredients.length > 0
					? `; ${missingLabel}: ${idea.missingIngredients.join(', ')}`
					: '';
			return `- ${idea.title}: ${useLabel} ${idea.ingredientsToUse.join(', ')}${missing}`;
		})
		.join('\n');
}

export function upcomingDateRange(daysAhead: number): { fromDate: string; toDate: string } {
	const from = new Date();
	const to = addDays(from, daysAhead);
	return {
		fromDate: from.toISOString().slice(0, 10),
		toDate: to.toISOString().slice(0, 10)
	};
}

/** Alias used by recipe prompts (structured JSON inventory rows). */
export const formatStructuredInventoryJsonPayload = formatStructuredInventoryPayload;
