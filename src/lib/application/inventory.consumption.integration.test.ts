import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { InventoryService } from './inventory.service';
import { DrizzleConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { consumptionEventTable } from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Inventory partial consumption integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: InventoryService;
	const householdId = 'household-consume';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const consumptionRepository = new DrizzleConsumptionRepository(integrationDb.db);
		service = new InventoryService(inventoryRepository, consumptionRepository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-consume' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Consume test',
			members: [{ userId: 'user-consume', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('reduces quantity and records partial consumption event', async () => {
		const created = await service.createItem(
			householdId,
			'user-consume',
			{ name: 'Grädde', location: 'fridge', quantity: '500', unit: 'g' },
			'owner'
		);

		const partial = await service.consumeItem(
			householdId,
			created.id,
			'user-consume',
			'owner',
			{ customAmount: '50' }
		);

		expect(partial.finished).toBe(false);
		expect(Number(partial.item.quantity)).toBe(450);

		const events = await integrationDb.db
			.select()
			.from(consumptionEventTable)
			.where(eq(consumptionEventTable.householdId, householdId));

		expect(events).toHaveLength(1);
		expect(Number(events[0].quantity)).toBe(50);
		expect(events[0].notes).toMatch(/partial:450/);
	});

	it('finishes item when consuming all stock', async () => {
		const created = await service.createItem(
			householdId,
			'user-consume',
			{ name: 'Mjölk', location: 'fridge', quantity: '1', unit: 'L' },
			'owner'
		);

		const result = await service.consumeItem(
			householdId,
			created.id,
			'user-consume',
			'owner',
			{ preset: 'all' }
		);

		expect(result.finished).toBe(true);
		expect(Number(result.item.quantity)).toBe(0);
	});
});
