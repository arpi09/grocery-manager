import { describe, expect, it, vi } from 'vitest';
import { InventoryIntelligenceService } from './inventory-intelligence.service';
import type { PurchasePatternService } from './purchase-pattern.service';
import type { InventoryService } from './inventory.service';
import type { InventoryItem } from '$lib/domain/inventory-item';

function item(overrides: Partial<InventoryItem> & Pick<InventoryItem, 'name'>): InventoryItem {
	return {
		id: overrides.id ?? 'item-1',
		householdId: overrides.householdId ?? 'hh-1',
		userId: overrides.userId ?? 'user-1',
		location: overrides.location ?? 'fridge',
		quantity: overrides.quantity ?? '1',
		unit: overrides.unit ?? null,
		expiresOn: overrides.expiresOn ?? null,
		expiresOnSource: overrides.expiresOnSource ?? null,
		notes: overrides.notes ?? null,
		barcode: overrides.barcode ?? null,
		lastConfirmedAt: overrides.lastConfirmedAt ?? new Date('2026-01-01T12:00:00Z'),
		createdAt: overrides.createdAt ?? new Date('2026-01-01T12:00:00Z'),
		updatedAt: overrides.updatedAt ?? new Date('2026-01-01T12:00:00Z'),
		name: overrides.name
	};
}

describe('InventoryIntelligenceService', () => {
	it('aggregates replenishment, pantry health, and waste signals', async () => {
		const purchasePatternService = {
			getReplenishmentSuggestions: vi.fn().mockResolvedValue([
				{
					normalizedKey: 'mjolk',
					displayName: 'Mjölk 1L',
					location: 'fridge',
					quantity: '1',
					unit: 'L',
					importCount: 2,
					lineCount: 2,
					avgIntervalDays: null,
					daysSinceLast: 10,
					reasonCode: 'recurring_not_in_pantry'
				}
			]),
			getDedupeContext: vi.fn().mockResolvedValue({
				recentLines: [],
				listNormalizedNames: new Set<string>()
			})
		} as unknown as PurchasePatternService;

		const inventoryService = {
			listAll: vi.fn().mockResolvedValue([
				item({
					name: 'Yogurt',
					expiresOn: '2026-06-03',
					lastConfirmedAt: new Date('2025-12-01T12:00:00Z')
				}),
				item({
					id: 'dup-a',
					name: 'Beans',
					expiresOn: null,
					lastConfirmedAt: new Date('2025-01-01T12:00:00Z')
				}),
				item({
					id: 'dup-b',
					name: 'beans',
					expiresOn: null,
					lastConfirmedAt: new Date('2025-01-01T12:00:00Z')
				})
			])
		} as unknown as InventoryService;

		const service = new InventoryIntelligenceService(purchasePatternService, inventoryService);
		const snapshot = await service.getHomeIntelligence('hh-1');

		expect(snapshot.replenishment).toHaveLength(1);
		expect(snapshot.pantryHealth.some((entry) => entry.kind === 'stale')).toBe(true);
		expect(snapshot.pantryHealth.some((entry) => entry.kind === 'duplicate')).toBe(true);
		expect(snapshot.waste).toMatchObject({ expiringCount: 1, href: '#eat-first' });
		expect(snapshot.dedupeByKey).toEqual({});
	});

	it('returns empty signals when pantry is clear', async () => {
		const purchasePatternService = {
			getReplenishmentSuggestions: vi.fn().mockResolvedValue([]),
			getDedupeContext: vi.fn().mockResolvedValue({
				recentLines: [],
				listNormalizedNames: new Set<string>()
			})
		} as unknown as PurchasePatternService;
		const inventoryService = {
			listAll: vi.fn().mockResolvedValue([])
		} as unknown as InventoryService;

		const service = new InventoryIntelligenceService(purchasePatternService, inventoryService);
		const snapshot = await service.getHomeIntelligence('hh-1');

		expect(snapshot.replenishment).toEqual([]);
		expect(snapshot.pantryHealth).toEqual([]);
		expect(snapshot.waste).toBeNull();
		expect(snapshot.dedupeByKey).toEqual({});
	});

	it('includes dedupe warnings for replenishment keys', async () => {
		const purchasePatternService = {
			getReplenishmentSuggestions: vi.fn().mockResolvedValue([
				{
					normalizedKey: 'beans',
					displayName: 'Beans',
					location: 'cupboard',
					quantity: '1',
					unit: null,
					importCount: 2,
					lineCount: 2,
					lastPurchasedAt: new Date('2026-06-01T12:00:00Z'),
					reasonCode: 'recurring_not_in_pantry',
					daysSinceLast: 10,
					avgIntervalDays: null,
					purchaseCount: 2
				}
			]),
			getDedupeContext: vi.fn().mockResolvedValue({
				recentLines: [],
				listNormalizedNames: new Set(['beans'])
			})
		} as unknown as PurchasePatternService;

		const inventoryService = {
			listAll: vi.fn().mockResolvedValue([])
		} as unknown as InventoryService;

		const service = new InventoryIntelligenceService(purchasePatternService, inventoryService);
		const snapshot = await service.getHomeIntelligence('hh-1');

		expect(snapshot.dedupeByKey.beans?.some((entry) => entry.kind === 'on_list')).toBe(true);
	});
});
