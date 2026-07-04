import type { ReplenishmentSuggestion } from './replenishment';
import { buildMemoryCadencePresentation, type MemoryCadenceMessageKey } from './shopping-v2-presenter';
import type { ShoppingListItem } from './shopping-list-item';

/**
 * Söndagsförslaget — the week's shopping list that writes itself.
 *
 * Fuses two evidence streams into one pre-filled proposal on /inkop:
 *  - replenishment (deterministic buy-again cadence, structured i18n reason)
 *  - AI suggestions (blends expiring restocks + planned meals + staples, free-text reason)
 *
 * Everything here is a *proposal*. Nothing is written to the shared list until the
 * user taps a row in — no silent side effects. The surface degrades gracefully:
 * with only one stream present (sparse data / no AI key) it simply shows fewer rows.
 */

export const SUNDAY_SUGGESTION_MAX = 10;

/** Structural subset of the server ShoppingSuggestion — keeps this module server-free. */
export interface SundayAiSuggestionInput {
	name: string;
	quantity: string;
	reason: string;
	priority: 'high' | 'medium' | 'low';
	relatedMealDate?: string | null;
	relatedRecipeTitle?: string | null;
}

export type SundayReason =
	| { kind: 'i18n'; key: MemoryCadenceMessageKey; params: Record<string, string | number> }
	| { kind: 'text'; text: string };

export type SundaySource = 'replenishment' | 'ai';

export interface SundaySuggestion {
	/** Stable key for {#each} and dedupe — the normalized item name. */
	key: string;
	source: SundaySource;
	name: string;
	/** Display-only quantity, e.g. "2 st" / "500 g" / "" when unknown. */
	quantityLabel: string;
	reason: SundayReason;
	/** Present on replenishment rows — the accept key for deterministic server add. */
	normalizedKey: string | null;
	relatedMealDate: string | null;
	relatedRecipeTitle: string | null;
}

function normalizeName(name: string): string {
	return name.trim().toLowerCase();
}

const PRIORITY_WEIGHT: Record<SundayAiSuggestionInput['priority'], number> = {
	high: 3,
	medium: 2,
	low: 1
};

function replenishmentQuantityLabel(suggestion: ReplenishmentSuggestion): string {
	const quantity = suggestion.quantity?.trim();
	const unit = suggestion.unit?.trim();
	if (!quantity) return unit ?? '';
	return unit ? `${quantity} ${unit}` : quantity;
}

/**
 * Fuse replenishment + AI suggestions into a single deduped, capped proposal.
 * Replenishment rows lead (highest trust, evidence-based); AI rows follow by priority.
 * Anything already on the unchecked list is skipped so the panel never proposes a dup.
 */
export function buildSundayProposal(input: {
	replenishment: ReplenishmentSuggestion[];
	aiSuggestions: SundayAiSuggestionInput[];
	listItems: ShoppingListItem[];
}): SundaySuggestion[] {
	const seen = new Set<string>();
	for (const item of input.listItems) {
		if (!item.checked) {
			seen.add(normalizeName(item.name));
		}
	}

	const rows: SundaySuggestion[] = [];

	const pushRow = (row: SundaySuggestion): boolean => {
		if (!row.name || seen.has(row.key)) return false;
		seen.add(row.key);
		rows.push(row);
		return true;
	};

	// 1. Replenishment first — deterministic cadence evidence carries the most trust.
	for (const suggestion of input.replenishment) {
		if (rows.length >= SUNDAY_SUGGESTION_MAX) break;
		const name = suggestion.displayName.trim();
		const cadence = buildMemoryCadencePresentation(suggestion);
		pushRow({
			key: normalizeName(name),
			source: 'replenishment',
			name,
			quantityLabel: replenishmentQuantityLabel(suggestion),
			reason: { kind: 'i18n', key: cadence.key, params: cadence.params },
			normalizedKey: suggestion.normalizedKey,
			relatedMealDate: null,
			relatedRecipeTitle: null
		});
	}

	// 2. AI suggestions by priority — these carry the expiring/meal reasons in free text.
	const orderedAi = [...input.aiSuggestions]
		.map((suggestion, index) => ({ suggestion, index }))
		.sort((a, b) => {
			const weightDiff =
				PRIORITY_WEIGHT[b.suggestion.priority] - PRIORITY_WEIGHT[a.suggestion.priority];
			return weightDiff !== 0 ? weightDiff : a.index - b.index;
		});

	for (const { suggestion } of orderedAi) {
		if (rows.length >= SUNDAY_SUGGESTION_MAX) break;
		const name = suggestion.name.trim();
		const reason = suggestion.reason.trim();
		if (!reason) continue;
		pushRow({
			key: normalizeName(name),
			source: 'ai',
			name,
			quantityLabel: suggestion.quantity.trim(),
			reason: { kind: 'text', text: reason },
			normalizedKey: null,
			relatedMealDate: suggestion.relatedMealDate ?? null,
			relatedRecipeTitle: suggestion.relatedRecipeTitle ?? null
		});
	}

	return rows;
}
