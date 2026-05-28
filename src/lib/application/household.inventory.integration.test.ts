import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HouseholdService } from './household.service';
import { InventoryService } from './inventory.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DEFAULT_HOUSEHOLD_ID } from '$lib/infrastructure/db/seed-household';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Shared household inventory', () => {
	let integrationDb: IntegrationDbContext;
	let inventoryService: InventoryService;
	let householdService: HouseholdService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		inventoryService = new InventoryService(inventoryRepository);
		householdService = new HouseholdService(householdRepository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('lets two members of the same household see the same inventory', async () => {
		await integrationDb.seedUser({ id: 'user-admin', email: 'admin@example.com' });
		await integrationDb.seedUser({ id: 'user-member', email: 'member@example.com' });
		await integrationDb.seedHousehold({
			id: DEFAULT_HOUSEHOLD_ID,
			name: 'Hemmet',
			members: [
				{ userId: 'user-admin', role: 'owner' },
				{ userId: 'user-member', role: 'member' }
			]
		});

		const adminHouseholdId = await householdService.ensureHouseholdForUser('user-admin');
		const memberHouseholdId = await householdService.ensureHouseholdForUser('user-member');

		expect(adminHouseholdId).toBe(DEFAULT_HOUSEHOLD_ID);
		expect(memberHouseholdId).toBe(DEFAULT_HOUSEHOLD_ID);

		await inventoryService.createItem(DEFAULT_HOUSEHOLD_ID, 'user-admin', {
			name: 'Shared milk',
			location: 'fridge',
			quantity: '1'
		});

		const adminItems = await inventoryService.listByLocation(DEFAULT_HOUSEHOLD_ID, 'fridge');
		const memberItems = await inventoryService.listByLocation(DEFAULT_HOUSEHOLD_ID, 'fridge');

		expect(adminItems).toHaveLength(1);
		expect(memberItems).toEqual(adminItems);
	});

	it('isolates inventory between different households', async () => {
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

		await inventoryService.createItem('household-a', 'user-a', {
			name: 'Only in A',
			location: 'cupboard',
			quantity: '1'
		});

		const itemsA = await inventoryService.listAll('household-a');
		const itemsB = await inventoryService.listAll('household-b');

		expect(itemsA).toHaveLength(1);
		expect(itemsB).toHaveLength(0);
	});
});
