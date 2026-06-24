import type { ReplenishmentReasonCode, ReplenishmentSuggestion } from './replenishment';
import type { ShoppingListItem } from './shopping-list-item';
import { limitMemorySuggestions } from './shopping-trip';

export type MemoryCadenceMessageKey =
	| 'shopping.v2.memory.cadenceEvery'
	| 'shopping.v2.memory.cadenceEveryDays'
	| 'replenishment.reason.recurringNotInPantry'
	| 'replenishment.reason.cadenceOverdue'
	| 'replenishment.reason.recurringAndCadence';

export interface MemoryCadencePresentation {
	key: MemoryCadenceMessageKey;
	params: Record<string, string | number>;
}

export function visibleMemorySuggestions(
	suggestions: ReplenishmentSuggestion[],
	options?: { hideCadence?: boolean }
): ReplenishmentSuggestion[] {
	const filtered = options?.hideCadence
		? suggestions.filter(
				(suggestion) =>
					suggestion.reasonCode !== 'cadence_overdue' &&
					suggestion.reasonCode !== 'recurring_and_cadence'
			)
		: suggestions;
	return limitMemorySuggestions(filtered);
}

export function memorySuggestionId(suggestion: ReplenishmentSuggestion): string {
	return suggestion.normalizedKey;
}

export function isSuggestionOnList(
	suggestion: ReplenishmentSuggestion,
	items: ShoppingListItem[]
): boolean {
	return items.some(
		(item) =>
			!item.checked &&
			item.name.trim().toLowerCase() === suggestion.displayName.trim().toLowerCase()
	);
}

export function buildMemoryCadencePresentation(
	suggestion: ReplenishmentSuggestion
): MemoryCadencePresentation {
	const code: ReplenishmentReasonCode = suggestion.reasonCode;

	if (code === 'recurring_not_in_pantry') {
		return {
			key: 'replenishment.reason.recurringNotInPantry',
			params: { count: suggestion.lineCount }
		};
	}

	if (code === 'cadence_overdue') {
		return {
			key: 'replenishment.reason.cadenceOverdue',
			params: {
				days: suggestion.daysSinceLast,
				interval: suggestion.avgIntervalDays ?? 0
			}
		};
	}

	return {
		key: 'replenishment.reason.recurringAndCadence',
		params: {
			count: suggestion.lineCount,
			days: suggestion.daysSinceLast,
			interval: suggestion.avgIntervalDays ?? 0
		}
	};
}

export function buildPlanHeaderTitle(tripLabel: string | null | undefined): {
	useTripLabel: boolean;
	tripLabel: string;
} {
	const trimmed = tripLabel?.trim();
	if (trimmed) {
		return { useTripLabel: true, tripLabel: trimmed };
	}
	return { useTripLabel: false, tripLabel: '' };
}
