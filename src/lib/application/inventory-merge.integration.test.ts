import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InventoryService } from './inventory.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Inventory merge integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: InventoryService;
	const householdId = 'household-merge';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		const repository = new DrizzleInventoryRepository(integrationDb.db);
		service = new InventoryService(repository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-merge' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Merge test',
			members: [{ userId: 'user-merge', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('increments quantity on existing row via mergeIntoId', async () => {
		const existing = await service.createItem(
			householdId,
			'user-merge',
			{ name: 'Mjölk 1L', location: 'fridge', quantity: '1', unit: 'L' },
			'owner'
		);

		const merged = await service.createItem(
			householdId,
			'user-merge',
			{
				name: 'mjölk',
				location: 'fridge',
				quantity: '2',
				unit: 'L',
				mergeIntoId: existing.id
			},
			'owner'
		);

		expect(merged.id).toBe(existing.id);
		expect(Number(merged.quantity)).toBe(3);
	});

	it('finds merge candidate by normalized name and location', async () => {
		await service.createItem(
			householdId,
			'user-merge',
			{ name: 'Bröd', location: 'cupboard', quantity: '1' },
			'owner'
		);

		const candidate = await service.findMergeCandidate(householdId, 'bröd', 'cupboard');
		expect(candidate?.name).toBe('Bröd');
	});
});
