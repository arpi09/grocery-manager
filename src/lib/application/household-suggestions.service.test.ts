import { describe, expect, it, vi } from 'vitest';
import type { StorageLocation } from '$lib/domain/location';
import { HouseholdSuggestionsService } from './household-suggestions.service';
import type { IHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import type { IHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import type { IPurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';

describe('HouseholdSuggestionsService', () => {
	const shelfLifeRepository: IHouseholdShelfLifeRuleRepository = {
		findByKey: vi.fn(),
		listByHousehold: vi.fn(async () => [
			{
				householdId: 'hh-1',
				normalizedKey: 'mjolk',
				location: 'fridge' as StorageLocation,
				typicalDays: 7,
				sampleCount: 2,
				lastPredictedDays: 7,
				updatedAt: new Date('2026-01-01')
			}
		]),
		delete: vi.fn(),
		upsert: vi.fn()
	};

	const locationRepository: IHouseholdLocationRuleRepository = {
		findByKey: vi.fn(),
		listByHousehold: vi.fn(async () => [
			{
				householdId: 'hh-1',
				normalizedKey: 'yoghurt',
				location: 'fridge' as StorageLocation,
				sampleCount: 5,
				updatedAt: new Date('2026-06-01')
			}
		]),
		delete: vi.fn(),
		upsert: vi.fn()
	};

	const purchasePatternRepository: IPurchasePatternRepository = {
		insertLines: vi.fn(),
		listRecentLines: vi.fn(async () => []),
		listDismissedKeys: vi.fn(async (): Promise<Set<string>> => new Set()),
		dismissPattern: vi.fn(),
		restoreDismissal: vi.fn(async (): Promise<boolean> => false),
		listInventoryNormalizedKeys: vi.fn(),
		listActiveInventoryMatches: vi.fn(async () => [
			{
				id: 'item-1',
				name: 'Mjölk',
				location: 'fridge' as StorageLocation,
				quantity: '1',
				unit: null,
				normalizedKey: 'mjolk'
			}
		]),
		listShoppingListNormalizedNames: vi.fn(),
		countReceiptLines: vi.fn(async () => 3),
		listTopPurchaseAliases: vi.fn(async () => [])
	};

	const service = new HouseholdSuggestionsService(
		shelfLifeRepository,
		locationRepository,
		purchasePatternRepository
	);

	it('maps repository rows to display views', async () => {
		const snapshot = await service.getSnapshot('hh-1');

		expect(snapshot.hasRules).toBe(true);
		expect(snapshot.shelfLifeRules[0]?.normalizedKey).toBe('mjolk');
		expect(snapshot.locationRules[0]?.normalizedKey).toBe('yoghurt');
	});

	it('builds merged memory facets with confidence tiers and item lookup', async () => {
		const memory = await service.getMemorySnapshot('hh-1', 'sv');

		expect(memory.receiptLineCount).toBe(3);
		expect(memory.hasRules).toBe(true);
		expect(memory.memoryFacets).toHaveLength(2);
		expect(memory.memoryFacets[0]?.displayName).toBe('Mjolk');
		expect(memory.memoryFacets[0]?.confidenceTier).toBe('low');
		expect(memory.memoryFacets[0]?.correctItemId).toBe('item-1');
		expect(memory.memoryFacets[1]?.displayName).toBe('Yoghurt');
		expect(memory.memoryFacets[1]?.confidenceTier).toBe('high');
	});

	it('delegates reset to repositories', async () => {
		vi.mocked(shelfLifeRepository.delete).mockResolvedValue(true);
		vi.mocked(locationRepository.delete).mockResolvedValue(true);

		await service.resetShelfLifeRule('hh-1', 'mjolk', 'fridge');
		await service.resetLocationRule('hh-1', 'mjolk');

		expect(shelfLifeRepository.delete).toHaveBeenCalledWith('hh-1', 'mjolk', 'fridge');
		expect(locationRepository.delete).toHaveBeenCalledWith('hh-1', 'mjolk');
	});
});
