import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';

export type HomeForYouKind = 'replenishment' | 'expiring';

export interface HomeForYouReplenishment {
	kind: 'replenishment';
	suggestion: ReplenishmentSuggestion;
}

export interface HomeForYouExpiring {
	kind: 'expiring';
	item: InventoryItem;
}

export type HomeForYouRecommendation = HomeForYouReplenishment | HomeForYouExpiring;

export function deriveHomeForYou(
	intelligence: Pick<HomeIntelligenceSnapshot, 'replenishment'>,
	expiringSoon: InventoryItem[]
): HomeForYouRecommendation | null {
	if (intelligence.replenishment.length > 0) {
		return { kind: 'replenishment', suggestion: intelligence.replenishment[0]! };
	}
	if (expiringSoon.length > 0) {
		return { kind: 'expiring', item: expiringSoon[0]! };
	}
	return null;
}
