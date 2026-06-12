import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
import type { PantryHealthInsight } from '$lib/domain/pantry-health';
import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';
import type { WasteAlert } from '$lib/domain/waste-prevention';

export type BriefingPrimaryKind =
	| 'waste'
	| 'replenishment'
	| 'pantry_health'
	| 'sync'
	| 'shopping'
	| 'none';

export interface HouseholdBriefingCounts {
	waste: number;
	replenishment: number;
	pantryHealth: number;
	sync: number;
	shopping: number;
}

export interface HouseholdBriefing {
	primaryKind: BriefingPrimaryKind;
	waste: WasteAlert | null;
	replenishment: ReplenishmentSuggestion[];
	pantryHealth: PantryHealthInsight[];
	showSync: boolean;
	staleCount: number;
	showShoppingTeaser: boolean;
	hasActionableContent: boolean;
	hideWeeklyRitualSync: boolean;
	counts: HouseholdBriefingCounts;
}

export const BRIEFING_MAX_REPLENISHMENT_ROWS = 3;
export const BRIEFING_MAX_VISIBLE_LINES = 3;

export interface ComposeHouseholdBriefingInput {
	intelligence: HomeIntelligenceSnapshot;
	staleCount: number;
	shoppingListCount: number;
}

function pantryHealthWithoutStale(insights: PantryHealthInsight[]): PantryHealthInsight[] {
	return insights.filter((entry) => entry.kind !== 'stale');
}

function hasStaleHealthInsight(insights: PantryHealthInsight[]): boolean {
	return insights.some((entry) => entry.kind === 'stale');
}

export function composeHouseholdBriefing(input: ComposeHouseholdBriefingInput): HouseholdBriefing {
	const { intelligence, staleCount, shoppingListCount } = input;
	const waste = intelligence.waste;
	const replenishment = intelligence.replenishment.slice(0, BRIEFING_MAX_REPLENISHMENT_ROWS);
	const pantryHealth = intelligence.pantryHealth;
	const showSync = staleCount > 0 && !hasStaleHealthInsight(pantryHealth);
	const showShoppingTeaser = shoppingListCount >= 0;

	let primaryKind: BriefingPrimaryKind = 'none';

	if (waste) {
		primaryKind = 'waste';
	} else if (replenishment.length > 0) {
		primaryKind = 'replenishment';
	} else if (hasStaleHealthInsight(pantryHealth)) {
		primaryKind = 'pantry_health';
	} else if (pantryHealthWithoutStale(pantryHealth).length > 0) {
		primaryKind = 'pantry_health';
	} else if (showSync) {
		primaryKind = 'sync';
	} else if (showShoppingTeaser) {
		primaryKind = 'shopping';
	}

	const hasActionableContent =
		Boolean(waste) ||
		replenishment.length > 0 ||
		pantryHealth.length > 0 ||
		showSync ||
		showShoppingTeaser;

	const counts: HouseholdBriefingCounts = {
		waste: waste?.expiringCount ?? 0,
		replenishment: intelligence.replenishment.length,
		pantryHealth: pantryHealth.length,
		sync: showSync ? staleCount : 0,
		shopping: shoppingListCount
	};

	return {
		primaryKind,
		waste,
		replenishment,
		pantryHealth,
		showSync: showSync && primaryKind !== 'sync',
		staleCount,
		showShoppingTeaser: showShoppingTeaser && primaryKind !== 'shopping',
		hasActionableContent,
		hideWeeklyRitualSync: primaryKind === 'sync' || (primaryKind === 'pantry_health' && hasStaleHealthInsight(pantryHealth)),
		counts
	};
}

export function briefingVisiblePantryHealth(
	briefing: HouseholdBriefing,
	maxLines = BRIEFING_MAX_VISIBLE_LINES
): PantryHealthInsight[] {
	if (briefing.primaryKind === 'waste' || briefing.primaryKind === 'replenishment') {
		const budget = Math.max(0, maxLines - 1 - (briefing.replenishment.length > 0 ? 1 : 0));
		return briefing.pantryHealth.slice(0, budget);
	}

	if (briefing.primaryKind === 'pantry_health') {
		return briefing.pantryHealth.slice(0, maxLines);
	}

	return briefing.pantryHealth.slice(0, Math.max(0, maxLines - 1));
}
