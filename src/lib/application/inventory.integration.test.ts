import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InventoryService } from './inventory.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Inventory integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: InventoryService;
	const householdId = 'household-test';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		const repository = new DrizzleInventoryRepository(integrationDb.db);
		service = new InventoryService(repository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedHouseholdForUser(userId: string) {
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Test household',
			members: [{ userId, role: 'owner' }]
		});
	}

	it('creates and lists items through service + repository + database', async () => {
		await seedHouseholdForUser('user-1');

		const created = await service.createItem(
			householdId,
			'user-1',
			{
				name: 'Milk',
				location: 'fridge',
				quantity: '1',
				unit: 'L'
			},
			'owner'
		);

		const listed = await service.listByLocation(householdId, 'fridge');

		expect(created.name).toBe('Milk');
		expect(listed).toHaveLength(1);
		expect(listed[0]).toMatchObject({
			id: created.id,
			householdId,
			userId: 'user-1',
			name: 'Milk',
			location: 'fridge'
		});
	});

	it('returns dashboard summary with expiring-soon items', async () => {
		await seedHouseholdForUser('user-2');

		const soonDate = new Date();
		soonDate.setDate(soonDate.getDate() + 2);

		const laterDate = new Date();
		laterDate.setDate(laterDate.getDate() + 30);

		await service.createItem(
			householdId,
			'user-2',
			{
				name: 'Yoghurt',
				location: 'fridge',
				quantity: '1',
				expiresOn: soonDate.toISOString().slice(0, 10)
			},
			'owner'
		);

		await service.createItem(
			householdId,
			'user-2',
			{
				name: 'Rice',
				location: 'cupboard',
				quantity: '1',
				expiresOn: laterDate.toISOString().slice(0, 10)
			},
			'owner'
		);

		const summary = await service.getDashboard(householdId);

		expect(summary.totalItems).toBe(2);
		expect(summary.expiringSoon).toHaveLength(1);
		expect(summary.expiringSoon[0].name).toBe('Yoghurt');
		expect(summary.counts).toEqual(
			expect.arrayContaining([
				{ location: 'fridge', count: 1 },
				{ location: 'cupboard', count: 1 },
				{ location: 'freezer', count: 0 }
			])
		);
	});
});
