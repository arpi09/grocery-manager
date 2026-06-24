import { describe, expect, it, vi } from 'vitest';
import type { InventoryService } from '$lib/application/inventory.service';
import {
	bulkInferMissingExpiryAllLocations,
	bulkInferMissingExpiryForLocation
} from './bulk-infer-missing-expiry';

function item(id: string, expiresOn: string | null = null) {
	return {
		id,
		name: `Item ${id}`,
		expiresOn,
		quantity: '1',
		unit: null,
		location: 'fridge' as const,
		householdId: 'hh-1',
		userId: 'user-1',
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

describe('bulkInferMissingExpiryForLocation', () => {
	it('returns 0 when no undated active items', async () => {
		const inventoryService = {
			listByLocation: vi.fn().mockResolvedValue([item('1', '2099-01-01')]),
			bulkInferExpiryForLocation: vi.fn()
		} as unknown as InventoryService;

		const count = await bulkInferMissingExpiryForLocation(
			'hh-1',
			'fridge',
			inventoryService,
			null,
			'owner'
		);

		expect(count).toBe(0);
		expect(inventoryService.bulkInferExpiryForLocation).not.toHaveBeenCalled();
	});

	it('falls back to shelf-life inference when no API key', async () => {
		const inventoryService = {
			listByLocation: vi.fn().mockResolvedValue([item('1')]),
			bulkInferExpiryForLocation: vi.fn().mockResolvedValue(1)
		} as unknown as InventoryService;

		const count = await bulkInferMissingExpiryForLocation(
			'hh-1',
			'fridge',
			inventoryService,
			null,
			'owner'
		);

		expect(count).toBe(1);
		expect(inventoryService.bulkInferExpiryForLocation).toHaveBeenCalledWith('hh-1', 'fridge', 'owner');
	});
});

describe('bulkInferMissingExpiryAllLocations', () => {
	it('sums inference across all storage locations', async () => {
		const inventoryService = {
			listByLocation: vi.fn().mockResolvedValue([]),
			bulkInferExpiryForLocation: vi.fn().mockResolvedValue(0)
		} as unknown as InventoryService;

		await bulkInferMissingExpiryAllLocations('hh-1', inventoryService, null, 'owner');

		expect(inventoryService.listByLocation).toHaveBeenCalledTimes(3);
		expect(inventoryService.listByLocation).toHaveBeenCalledWith('hh-1', 'fridge');
		expect(inventoryService.listByLocation).toHaveBeenCalledWith('hh-1', 'freezer');
		expect(inventoryService.listByLocation).toHaveBeenCalledWith('hh-1', 'cupboard');
	});
});
