import { describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { addRecipeMissingToShoppingWithDedupe } from '$lib/server/recipe-to-shopping';
import type { InventoryService } from '$lib/application/inventory.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { PurchasePatternService } from '$lib/application/purchase-pattern.service';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: 'inv-1',
		householdId: 'h1',
		userId: 'u1',
		name: 'Mjölk',
		location: 'fridge',
		quantity: '2',
		unit: 'l',
		expiresOn: '2026-06-01',
		expiresOnSource: 'household_learned',
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date('2026-06-01'),
		createdAt: new Date('2026-06-01'),
		updatedAt: new Date('2026-06-01'),
		...overrides
	};
}

describe('recipe-to-shopping dedupe autopilot', () => {
	it('skips ingredients already on the shopping list when autopilot is on', async () => {
		const inventoryService = {
			listAll: vi.fn().mockResolvedValue([makeItem()])
		} as unknown as InventoryService;

		const shoppingListService = {
			addSuggestedItems: vi.fn().mockResolvedValue({ added: 0, skipped: 0 })
		} as unknown as ShoppingListService;

		const purchasePatternService = {
			getDedupeContext: vi.fn().mockResolvedValue({
				recentLines: [],
				listNormalizedNames: new Set(['basilika'])
			})
		} as unknown as PurchasePatternService;

		const result = await addRecipeMissingToShoppingWithDedupe({
			householdId: 'h1',
			role: 'owner',
			ingredients: ['Basilika', 'Citron'],
			inventoryService,
			shoppingListService,
			purchasePatternService,
			autopilotSkip: true
		});

		expect(result.dedupe).toHaveLength(2);
		expect(result.dedupe.find((entry) => entry.name === 'Basilika')?.skipped).toBe(true);
		expect(result.dedupe.find((entry) => entry.name === 'Citron')?.skipped).toBe(false);
		expect(shoppingListService.addSuggestedItems).toHaveBeenCalledWith(
			'h1',
			'owner',
			expect.arrayContaining([expect.objectContaining({ name: 'Citron' })])
		);
	});
});
