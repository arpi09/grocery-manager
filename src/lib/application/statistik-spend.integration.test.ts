import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { StatistikService } from './statistik.service';
import { InventoryService } from './inventory.service';
import { PurchasePatternService } from './purchase-pattern.service';
import { ShoppingListService } from './shopping-list.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { DrizzleConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzlePriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';
import { DrizzleMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Statistik spend integration', () => {
	let integrationDb: IntegrationDbContext;
	let statistikService: StatistikService;
	let purchasePatternService: PurchasePatternService;
	const householdId = 'household-statistik-spend';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const consumptionRepository = new DrizzleConsumptionRepository(integrationDb.db);
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		const inventoryService = new InventoryService(
			inventoryRepository,
			consumptionRepository,
			householdRepository
		);
		purchasePatternService = new PurchasePatternService(
			new DrizzlePurchasePatternRepository(integrationDb.db),
			inventoryService,
			new ShoppingListService(new DrizzleShoppingListRepository(integrationDb.db))
		);
		statistikService = new StatistikService(
			inventoryService,
			inventoryRepository,
			consumptionRepository,
			householdRepository,
			new DrizzlePriceMemoryRepository(integrationDb.db),
			new DrizzleMealPlanRepository()
		);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-statistik-spend' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Statistik spend test',
			members: [{ userId: 'user-statistik-spend', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('shows spend data for freshly imported receipt lines with old purchasedAt', async () => {
		await purchasePatternService.recordReceiptImport([
			{
				householdId,
				userId: 'user-statistik-spend',
				importBatchId: 'import-old-receipt',
				productName: 'Historiskt kvitto rad',
				location: 'cupboard',
				quantity: '1',
				unit: 'st',
				unitPrice: '49.90',
				lineTotal: '49.90',
				purchasedAt: new Date('2025-12-01T10:00:00.000Z')
			}
		]);

		const spend = await statistikService.getSpendReport(householdId);
		expect(spend.hasData).toBe(true);
	});

	it('keeps spend empty when household has no receipt purchase lines', async () => {
		const spend = await statistikService.getSpendReport(householdId);
		expect(spend.hasData).toBe(false);
	});
});
