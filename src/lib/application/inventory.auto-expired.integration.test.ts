import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryService } from './inventory.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { subtractDaysIso } from '$lib/domain/auto-expired';

vi.mock('$lib/server/shelf-life-inference', () => ({ inferShelfLife: vi.fn(async () => null) }));

describe('Inventory auto-expired integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: InventoryService;
	const householdId = 'household-auto-expired';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		service = new InventoryService(
			new DrizzleInventoryRepository(integrationDb.db),
			undefined,
			new DrizzleHouseholdRepository(integrationDb.db)
		);
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
			name: 'Auto-expired household',
			members: [{ userId, role: 'owner' }]
		});
	}

	it('separates auto-expired items from active list', async () => {
		await seed('user-1');
		const today = new Date().toISOString().slice(0, 10);
		await service.createItem(
			householdId,
			'user-1',
			{
				name: 'Old milk',
				location: 'fridge',
				quantity: '1',
				expiresOn: subtractDaysIso(today, 10),
				inferExpiry: false
			},
			'owner'
		);
		await service.createItem(
			householdId,
			'user-1',
			{
				name: 'Fresh milk',
				location: 'fridge',
				quantity: '1',
				expiresOn: subtractDaysIso(today, 1),
				inferExpiry: false
			},
			'owner'
		);

		expect(await service.countActiveByLocation(householdId, 'fridge')).toBe(1);
		expect(await service.countAutoExpiredByLocation(householdId, 'fridge')).toBe(1);
	});
});
