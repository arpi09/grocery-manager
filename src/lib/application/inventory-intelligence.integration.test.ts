import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InventoryIntelligenceService } from './inventory-intelligence.service';
import { InventoryService } from './inventory.service';
import { PurchasePatternService } from './purchase-pattern.service';
import { ShoppingListService } from './shopping-list.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { DrizzleConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Inventory intelligence integration', () => {
	let integrationDb: IntegrationDbContext;
	let intelligenceService: InventoryIntelligenceService;
	let purchasePatternService: PurchasePatternService;
	let inventoryService: InventoryService;
	const householdId = 'household-intelligence';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const consumptionRepository = new DrizzleConsumptionRepository(integrationDb.db);
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		inventoryService = new InventoryService(
			inventoryRepository,
			consumptionRepository,
			householdRepository
		);
		const shoppingListService = new ShoppingListService(
			new DrizzleShoppingListRepository(integrationDb.db)
		);
		purchasePatternService = new PurchasePatternService(
			new DrizzlePurchasePatternRepository(integrationDb.db),
			inventoryService,
			shoppingListService
		);
		intelligenceService = new InventoryIntelligenceService(
			purchasePatternService,
			inventoryService
		);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-intelligence' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Intelligence test',
			members: [{ userId: 'user-intelligence', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedRecurringMilk() {
		await purchasePatternService.recordReceiptImport([
			{
				householdId,
				userId: 'user-intelligence',
				importBatchId: 'import-1',
				productName: 'Arla Mjölk 1L',
				location: 'fridge',
				quantity: '1',
				unit: 'L'
			}
		]);
		await purchasePatternService.recordReceiptImport([
			{
				householdId,
				userId: 'user-intelligence',
				importBatchId: 'import-2',
				productName: 'Arla Mjölk 1L',
				location: 'fridge',
				quantity: '2',
				unit: 'L'
			}
		]);
	}

	it('aggregates replenishment from receipt lines', async () => {
		await seedRecurringMilk();
		const snapshot = await intelligenceService.getHomeIntelligence(householdId);
		expect(snapshot.replenishment).toHaveLength(1);
		expect(snapshot.replenishment[0]!.displayName).toBe('Arla Mjölk 1L');
		expect(snapshot.dedupeByKey).toEqual({});
	});

	it('surfaces pantry health and waste signals from inventory', async () => {
		const expiresOn = new Date();
		expiresOn.setDate(expiresOn.getDate() + 3);
		const dateStr = expiresOn.toISOString().slice(0, 10);

		await inventoryService.createItem(
			householdId,
			'user-intelligence',
			{
				name: 'Yogurt',
				location: 'fridge',
				quantity: '1',
				unit: null,
				expiresOn: dateStr,
				notes: null,
				lastConfirmedAt: new Date('2025-01-01T12:00:00Z')
			},
			'owner'
		);
		await inventoryService.createItem(
			householdId,
			'user-intelligence',
			{
				name: 'Beans',
				location: 'fridge',
				quantity: '1',
				unit: null,
				expiresOn: null,
				notes: null,
				lastConfirmedAt: new Date('2025-01-01T12:00:00Z')
			},
			'owner'
		);
		await inventoryService.createItem(
			householdId,
			'user-intelligence',
			{
				name: 'beans',
				location: 'fridge',
				quantity: '1',
				unit: null,
				expiresOn: null,
				notes: null,
				lastConfirmedAt: new Date('2025-01-01T12:00:00Z')
			},
			'owner'
		);

		const snapshot = await intelligenceService.getHomeIntelligence(householdId);
		expect(snapshot.pantryHealth.some((entry) => entry.kind === 'stale')).toBe(true);
		expect(snapshot.pantryHealth.some((entry) => entry.kind === 'duplicate')).toBe(true);
		expect(snapshot.waste).toMatchObject({ expiringCount: 1 });
	});
});
