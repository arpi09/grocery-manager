import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InventoryService } from './inventory.service';
import { PurchasePatternService } from './purchase-pattern.service';
import { ShoppingListService } from './shopping-list.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { DrizzleConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Purchase pattern integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: PurchasePatternService;
	const householdId = 'household-receipt-pattern';

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
		const shoppingListService = new ShoppingListService(
			new DrizzleShoppingListRepository(integrationDb.db)
		);
		service = new PurchasePatternService(
			new DrizzlePurchasePatternRepository(integrationDb.db),
			inventoryService,
			shoppingListService
		);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-pattern' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Pattern test',
			members: [{ userId: 'user-pattern', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedRecurringMilk() {
		await service.recordReceiptImport([
			{
				householdId,
				userId: 'user-pattern',
				importBatchId: 'import-1',
				productName: 'Arla Mjölk 1L',
				location: 'fridge',
				quantity: '1',
				unit: 'L'
			}
		]);
		await service.recordReceiptImport([
			{
				householdId,
				userId: 'user-pattern',
				importBatchId: 'import-2',
				productName: 'Arla Mjölk 1L',
				location: 'fridge',
				quantity: '2',
				unit: 'L'
			}
		]);
	}

	it('detects recurring receipt lines as suggestions', async () => {
		await seedRecurringMilk();
		const suggestions = await service.getSuggestions(householdId);
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0].displayName).toBe('Arla Mjölk 1L');
		expect(suggestions[0].importCount).toBe(2);
	});

	it('accepting a suggestion adds inventory item with last purchase defaults', async () => {
		await seedRecurringMilk();
		const [suggestion] = await service.getSuggestions(householdId);

		const result = await service.acceptSuggestion(
			householdId,
			'user-pattern',
			'owner',
			suggestion.normalizedKey
		);

		expect(result.name).toBe('Arla Mjölk 1L');

		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const items = await inventoryRepository.findByHouseholdAndLocation(householdId, 'fridge', {
			graceDays: 7
		});
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			name: 'Arla Mjölk 1L',
			quantity: '2.00',
			unit: 'L'
		});

		const afterAccept = await service.getSuggestions(householdId);
		expect(afterAccept).toHaveLength(0);
	});

	it('dismissed patterns are hidden from suggestions', async () => {
		await seedRecurringMilk();
		const [suggestion] = await service.getSuggestions(householdId);
		await service.dismissSuggestion(householdId, 'owner', suggestion.normalizedKey);
		expect(await service.getSuggestions(householdId)).toHaveLength(0);
	});

	it('replenishment suggestions surface on shopping list page flow', async () => {
		await seedRecurringMilk();
		const suggestions = await service.getReplenishmentSuggestions(householdId);
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0]!.displayName).toBe('Arla Mjölk 1L');
	});

	it('accepting replenishment adds shopping list row not inventory', async () => {
		await seedRecurringMilk();
		const [suggestion] = await service.getReplenishmentSuggestions(householdId);

		const result = await service.acceptReplenishmentToList(
			householdId,
			'owner',
			suggestion.normalizedKey
		);

		expect(result.name).toBe('Arla Mjölk 1L');

		const shoppingListRepository = new DrizzleShoppingListRepository(integrationDb.db);
		const listItems = await shoppingListRepository.listUncheckedByHousehold(householdId);
		expect(listItems).toHaveLength(1);
		expect(listItems[0]).toMatchObject({
			name: 'Arla Mjölk 1L',
			checked: false
		});

		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const pantryItems = await inventoryRepository.findByHouseholdAndLocation(householdId, 'fridge', {
			graceDays: 7
		});
		expect(pantryItems).toHaveLength(0);

		expect(await service.getReplenishmentSuggestions(householdId)).toHaveLength(0);
	});

	it('replenishment does not leak across households', async () => {
		await integrationDb.seedHousehold({
			id: 'household-other',
			name: 'Other',
			members: [{ userId: 'user-pattern', role: 'owner' }]
		});
		await seedRecurringMilk();

		const [suggestion] = await service.getReplenishmentSuggestions(householdId);
		await expect(
			service.acceptReplenishmentToList('household-other', 'owner', suggestion.normalizedKey)
		).rejects.toThrow();

		const shoppingListRepository = new DrizzleShoppingListRepository(integrationDb.db);
		expect(await shoppingListRepository.listUncheckedByHousehold('household-other')).toHaveLength(0);
	});

	it('replenishment count stays available after receipt import for shopping loop', async () => {
		await seedRecurringMilk();
		const suggestions = await service.getReplenishmentSuggestions(householdId);
		expect(suggestions).toHaveLength(1);

		await service.acceptReplenishmentToList(
			householdId,
			'owner',
			suggestions[0]!.normalizedKey
		);

		expect(await service.getReplenishmentSuggestions(householdId)).toHaveLength(0);
	});
});
