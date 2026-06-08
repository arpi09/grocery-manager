import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { InventoryService } from './inventory.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { STALENESS_THRESHOLD_DAYS } from '$lib/domain/inventory-staleness';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

vi.mock('$lib/server/shelf-life-inference', () => ({ inferShelfLife: vi.fn(async () => null) }));

describe('Inventory staleness integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: InventoryService;
	const householdId = 'household-staleness';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		service = new InventoryService(new DrizzleInventoryRepository(integrationDb.db));
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seed(userId: string) {
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Staleness household',
			members: [{ userId, role: 'owner' }]
		});
	}

	function daysAgo(days: number): Date {
		const date = new Date();
		date.setDate(date.getDate() - days);
		return date;
	}

	it('lists undated items with old lastConfirmedAt as stale', async () => {
		await seed('user-1');

		const fresh = await service.createItem(
			householdId,
			'user-1',
			{ name: 'Fresh rice', location: 'cupboard', quantity: '1', inferExpiry: false },
			'owner'
		);
		const stale = await service.createItem(
			householdId,
			'user-1',
			{ name: 'Old pasta', location: 'cupboard', quantity: '2', inferExpiry: false },
			'owner'
		);
		const dated = await service.createItem(
			householdId,
			'user-1',
			{
				name: 'Milk',
				location: 'fridge',
				quantity: '1',
				expiresOn: '2026-12-01',
				inferExpiry: false
			},
			'owner'
		);

		await integrationDb.db
			.update(inventoryItemTable)
			.set({ lastConfirmedAt: daysAgo(STALENESS_THRESHOLD_DAYS + 5) })
			.where(eq(inventoryItemTable.id, stale.id));

		expect(await service.countStaleUndated(householdId)).toBe(1);

		const batch = await service.listStaleUndatedBatch(householdId);
		expect(batch).toHaveLength(1);
		expect(batch[0]?.id).toBe(stale.id);

		const active = await service.listByLocation(householdId, 'cupboard');
		expect(active.map((item) => item.id).sort()).toEqual([fresh.id, stale.id].sort());

		void dated;
	});

	it('confirmStillHave bumps lastConfirmedAt and removes item from stale list', async () => {
		await seed('user-1');

		const item = await service.createItem(
			householdId,
			'user-1',
			{ name: 'Honey', location: 'cupboard', quantity: '1', inferExpiry: false },
			'owner'
		);

		await integrationDb.db
			.update(inventoryItemTable)
			.set({ lastConfirmedAt: daysAgo(STALENESS_THRESHOLD_DAYS + 1) })
			.where(eq(inventoryItemTable.id, item.id));

		expect(await service.countStaleUndated(householdId)).toBe(1);

		await service.confirmStillHave(householdId, item.id, 'owner');

		expect(await service.countStaleUndated(householdId)).toBe(0);
	});

	it('consume bumps lastConfirmedAt on partial use', async () => {
		await seed('user-1');

		const item = await service.createItem(
			householdId,
			'user-1',
			{ name: 'Flour', location: 'cupboard', quantity: '2', inferExpiry: false },
			'owner'
		);

		await integrationDb.db
			.update(inventoryItemTable)
			.set({ lastConfirmedAt: daysAgo(STALENESS_THRESHOLD_DAYS + 1) })
			.where(eq(inventoryItemTable.id, item.id));

		await service.consumeItem(householdId, item.id, 'user-1', 'owner', { preset: 'lite' });

		expect(await service.countStaleUndated(householdId)).toBe(0);
	});
});
