import type { PurchasePatternService } from './purchase-pattern.service';
import type { InventoryService } from './inventory.service';
import { isItemFinished } from '$lib/domain/inventory-item';
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
}

export class InventoryIntelligenceService {
	constructor(
		private readonly purchasePatternService: PurchasePatternService,
		private readonly inventoryService: InventoryService
	) {}

	async getHomeIntelligence(householdId: string): Promise<HomeIntelligenceSnapshot> {
		const [replenishment, items] = await Promise.all([
			this.purchasePatternService.getReplenishmentSuggestions(householdId),
			this.inventoryService.listAll(householdId)
		]);

		const activeItems = items.filter((item) => !isItemFinished(item));

		return {
			replenishment,
			pantryHealth: detectPantryHealthInsights(activeItems),
			waste: detectWasteAlert(activeItems)
		};
	}
}
