import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';

export interface ListIntelligenceHint {
	id: string;
	textKey: 'add' | 'skip';
	displayName: string;
	normalizedKey: string;
	reason: 'replenishment' | 'cadence' | 'dismiss_feedback';
}

export interface ListIntelligenceInput {
	replenishment: ReplenishmentSuggestion[];
	dismissedKeys?: Set<string>;
	recentPurchaseKeys?: Set<string>;
	maxHints?: number;
}

export function buildListIntelligenceHints(input: ListIntelligenceInput): ListIntelligenceHint[] {
	const maxHints = input.maxHints ?? 2;
	const dismissed = input.dismissedKeys ?? new Set<string>();
	const recent = input.recentPurchaseKeys ?? new Set<string>();
	const hints: ListIntelligenceHint[] = [];

	for (const suggestion of input.replenishment) {
		if (hints.length >= maxHints) break;
		if (dismissed.has(suggestion.normalizedKey)) {
			hints.push({
				id: `skip:${suggestion.normalizedKey}`,
				textKey: 'skip',
				displayName: suggestion.displayName,
				normalizedKey: suggestion.normalizedKey,
				reason: 'dismiss_feedback'
			});
			continue;
		}
		if (recent.has(suggestion.normalizedKey)) continue;
		hints.push({
			id: `add:${suggestion.normalizedKey}`,
			textKey: 'add',
			displayName: suggestion.displayName,
			normalizedKey: suggestion.normalizedKey,
			reason: 'replenishment'
		});
	}

	return hints.slice(0, maxHints);
}
