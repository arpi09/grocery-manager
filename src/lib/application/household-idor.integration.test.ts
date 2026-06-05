import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InventoryService } from './inventory.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { shelfLifeInferenceAdapter } from '$lib/infrastructure/adapters/shelf-life-inference.adapter';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Household IDOR isolation', () => {
	let integrationDb: IntegrationDbContext;
	let inventoryService: InventoryService;
	let inventoryRepository: DrizzleInventoryRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		inventoryService = new InventoryService(
			inventoryRepository,
			undefined,
			householdRepository,
			shelfLifeInferenceAdapter
		);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('returns null when household A queries an item owned by household B', async () => {
		await integrationDb.seedUser({ id: 'user-a', email: 'a@example.com' });
		await integrationDb.seedUser({ id: 'user-b', email: 'b@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			name: 'A',
			members: [{ userId: 'user-a', role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: 'household-b',
			name: 'B',
			members: [{ userId: 'user-b', role: 'owner' }]
		});

		const item = await inventoryService.createItem(
			'household-b',
			'user-b',
			{ name: 'Secret item', location: 'fridge', quantity: '1' },
			'owner'
		);

		const crossRead = await inventoryRepository.findById('household-a', item.id);
		expect(crossRead).toBeNull();
	});

	it('rejects update and delete across households', async () => {
		await integrationDb.seedUser({ id: 'user-a', email: 'a@example.com' });
		await integrationDb.seedUser({ id: 'user-b', email: 'b@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			name: 'A',
			members: [{ userId: 'user-a', role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: 'household-b',
			name: 'B',
			members: [{ userId: 'user-b', role: 'owner' }]
		});

		const item = await inventoryService.createItem(
			'household-b',
			'user-b',
			{ name: 'Protected', location: 'cupboard', quantity: '2' },
			'owner'
		);

		await expect(
			inventoryService.updateItem(
				'household-a',
				item.id,
				{ name: 'Hijacked' },
				'owner'
			)
		).rejects.toThrow();

		await expect(
			inventoryService.deleteItem('household-a', item.id, 'user-a', 'owner')
		).rejects.toThrow();

		const stillThere = await inventoryService.getItem('household-b', item.id);
		expect(stillThere?.name).toBe('Protected');
	});
});
