import type { PurchasePatternService } from './purchase-pattern.service';
import type { InventoryService } from './inventory.service';
import { isItemFinished } from '$lib/domain/inventory-item';
import {
	detectDedupeWarningsForKeys,
	type DedupeWarning
} from '$lib/domain/dedupe-autopilot';
import {
	detectPantryHealthInsights,
	type PantryHealthInsight
} from '$lib/domain/pantry-health';
import { detectWasteAlert, type WasteAlert } from '$lib/domain/waste-prevention';
import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';

export interface HomeIntelligenceSnapshot {
	replenishment: ReplenishmentSuggestion[];
	pantryHealth: PantryHealthInsight[];
	waste: WasteAlert | null;
	dedupeByKey: Record<string, DedupeWarning[]>;
}

export class InventoryIntelligenceService {
	constructor(
		private readonly purchasePatternService: PurchasePatternService,
		private readonly inventoryService: InventoryService
	) {}

	async getHomeIntelligence(householdId: string): Promise<HomeIntelligenceSnapshot> {
		const [replenishment, items, dedupeContext] = await Promise.all([
			this.purchasePatternService.getReplenishmentSuggestions(householdId),
			this.inventoryService.listAll(householdId),
			this.purchasePatternService.getDedupeContext(householdId)
		]);

		const activeItems = items.filter((item) => !isItemFinished(item));
		const dedupeKeys = replenishment.map((entry) => entry.normalizedKey);

		return {
			replenishment,
			pantryHealth: detectPantryHealthInsights(activeItems),
			waste: detectWasteAlert(activeItems),
			dedupeByKey: detectDedupeWarningsForKeys(dedupeKeys, {
				activeItems,
				recentLines: dedupeContext.recentLines,
				listNormalizedNames: dedupeContext.listNormalizedNames
			})
		};
	}
}
