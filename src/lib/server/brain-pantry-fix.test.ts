import { describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { runPantryFixBatch } from '$lib/server/brain-pantry-fix';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: 'inv-1',
		householdId: 'h1',
		userId: 'u1',
		name: 'Mjölk',
		location: 'fridge',
		quantity: '1',
		unit: 'l',
		expiresOn: null,
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date('2026-06-01'),
		createdAt: new Date('2026-06-01'),
		updatedAt: new Date('2026-06-01'),
		...overrides
	};
}

describe('brain pantry fix batch', () => {
	it('returns merge suggestions for duplicate normalized names', async () => {
		const items = [
			makeItem({ id: 'a', name: 'Mjölk 3%', createdAt: new Date('2026-06-01') }),
			makeItem({ id: 'b', name: 'mjölk 3%', createdAt: new Date('2026-06-02') })
		];

		const inventoryService = {
			listAll: vi.fn().mockResolvedValue(items)
		};

		const result = await runPantryFixBatch({
			householdId: 'h1',
			actorRole: 'owner',
			inventoryService: inventoryService as never,
			apiKey: null,
			inferExpiry: false,
			suggestMerges: true
		});

		expect(result.mergeSuggestions).toHaveLength(1);
		expect(result.mergeSuggestions[0]?.targetId).toBe('a');
		expect(result.mergeSuggestions[0]?.sourceId).toBe('b');
		expect(result.insights.missingExpiryCount).toBeGreaterThan(0);
	});
});
