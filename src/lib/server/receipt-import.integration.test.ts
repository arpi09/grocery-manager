import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '$lib/infrastructure/db';
import { productEventTable, receiptPurchaseLineTable } from '$lib/infrastructure/db/schema';
import { InventoryService } from '$lib/application/inventory.service';
import { PmfService } from '$lib/application/pmf.service';
import { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import { ShoppingListService } from '$lib/application/shopping-list.service';
import { DrizzleConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { learningEngineService } from '$lib/server/di';
import { importReceiptLines } from './receipt-import';

const { dbState } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null }
}));

vi.mock('$lib/infrastructure/db', () => ({
	db: new Proxy({} as AppDatabase, {
		get(_target, prop) {
			if (!dbState.db) {
				throw new Error('Integration db not initialized');
			}
			return Reflect.get(dbState.db, prop);
		}
	}),
	getDb: () => {
		if (!dbState.db) {
			throw new Error('Integration db not initialized');
		}
		return dbState.db;
	},
	initDatabase: vi.fn(),
	getDatabaseBackend: () => 'pglite' as const
}));

vi.mock('$lib/server/shelf-life-learning-flag', () => ({
	isShelfLifeLearningEnabled: () => false
}));

vi.mock('$lib/server/feature-flags', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/feature-flags')>();
	return {
		...actual,
		isLocationLearningEnabled: () => false
	};
});

describe('importReceiptLines integration', () => {
	let integrationDb: IntegrationDbContext;
	let inventoryService: InventoryService;
	let purchasePatternService: PurchasePatternService;
	let pmfService: PmfService;
	const householdId = 'household-receipt-import';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;

		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const consumptionRepository = new DrizzleConsumptionRepository(integrationDb.db);
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		inventoryService = new InventoryService(
			inventoryRepository,
			consumptionRepository,
			householdRepository
		);
		purchasePatternService = new PurchasePatternService(
			new DrizzlePurchasePatternRepository(integrationDb.db),
			inventoryService,
			new ShoppingListService(new DrizzleShoppingListRepository(integrationDb.db))
		);
		pmfService = new PmfService(new DrizzlePmfRepository());
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-import', email: 'import@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Receipt import household',
			members: [{ userId: 'user-import', role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	it('creates inventory items and purchase pattern lines from receipt lines', async () => {
		const result = await importReceiptLines({
			householdId,
			userId: 'user-import',
			role: 'owner',
			lines: [
				{ name: 'Arla MjÃ¶lk 1L', location: 'fridge', quantity: '1', unit: 'L' },
				{ name: 'Kavli Creme Fraiche', location: 'fridge', quantity: '2', unit: 'st' }
			],
			inventoryService,
			purchasePatternService,
			pmfService,
			learningEngineService,
			eventType: 'receipt_parsed',
			storeLabel: 'ICA',
			purchasedAt: '2026-06-22'
		});

		expect(result.itemsAdded).toBe(2);
		expect(result.importBatchId).toBeTruthy();
		expect(result.linesWithPrice).toBe(0);
		expect(result.totalLines).toBe(2);

		const fridgeItems = await inventoryService.listByLocation(householdId, 'fridge');
		expect(fridgeItems.map((item) => item.name).sort()).toEqual([
			'Arla MjÃ¶lk 1L',
			'Kavli Creme Fraiche'
		]);

		const purchaseLines = await integrationDb.db
			.select()
			.from(receiptPurchaseLineTable)
			.where(eq(receiptPurchaseLineTable.householdId, householdId));
		expect(purchaseLines).toHaveLength(2);
		expect(purchaseLines.every((line) => line.importBatchId === result.importBatchId)).toBe(true);
	});

	it('records receipt_parsed product event with import metadata', async () => {
		await importReceiptLines({
			householdId,
			userId: 'user-import',
			role: 'owner',
			lines: [{ name: 'BrÃ¶d', location: 'cupboard', quantity: '1', unit: 'st' }],
			inventoryService,
			purchasePatternService,
			pmfService,
			learningEngineService,
			eventType: 'receipt_parsed',
			source: 'manual'
		});

		await vi.waitFor(async () => {
			const events = await integrationDb.db
				.select()
				.from(productEventTable)
				.where(eq(productEventTable.householdId, householdId));
			expect(events).toHaveLength(2);
			const parsed = events.find((event) => event.eventType === 'receipt_parsed');
			expect(parsed).toBeTruthy();
			expect(JSON.parse(parsed?.metadata ?? '{}')).toMatchObject({
				itemsAdded: 1,
				lineCount: 1,
				stage: 'import',
				source: 'manual'
			});
		});
	});

	it('records receipt_price_captured when lines include unitPrice', async () => {
		await importReceiptLines({
			householdId,
			userId: 'user-import',
			role: 'owner',
			lines: [
				{ name: 'MjÃ¶lk', location: 'fridge', unitPrice: '14.90' },
				{ name: 'BrÃ¶d', location: 'cupboard' }
			],
			inventoryService,
			purchasePatternService,
			pmfService,
			learningEngineService,
			eventType: 'receipt_parsed',
			source: 'manual'
		});

		await vi.waitFor(async () => {
			const events = await integrationDb.db
				.select()
				.from(productEventTable)
				.where(eq(productEventTable.householdId, householdId));
			const captured = events.find((event) => event.eventType === 'receipt_price_captured');
			expect(captured).toBeTruthy();
			expect(JSON.parse(captured?.metadata ?? '{}')).toMatchObject({
				linesWithPrice: 1,
				totalLines: 2,
				source: 'manual'
			});
		});
	});

	it('skips blank line names and imports valid lines only', async () => {
		const result = await importReceiptLines({
			householdId,
			userId: 'user-import',
			role: 'owner',
			lines: [
				{ name: '   ', location: 'fridge' },
				{ name: 'Ost', location: 'fridge', quantity: '1', unit: 'st' }
			],
			inventoryService,
			purchasePatternService,
			pmfService,
			learningEngineService,
			eventType: 'receipt_parsed'
		});

		expect(result.itemsAdded).toBe(1);
		const fridgeItems = await inventoryService.listByLocation(householdId, 'fridge');
		expect(fridgeItems).toHaveLength(1);
		expect(fridgeItems[0]?.name).toBe('Ost');
	});

	it('throws when no valid receipt lines remain', async () => {
		await expect(
			importReceiptLines({
				householdId,
				userId: 'user-import',
				role: 'owner',
				lines: [{ name: '  ', location: 'fridge' }],
				inventoryService,
				purchasePatternService,
				pmfService,
				learningEngineService,
				eventType: 'receipt_parsed'
			})
		).rejects.toThrow('No valid receipt lines to import');
	});

	it('persists purchase line price and store label from receipt import', async () => {
		const result = await importReceiptLines({
			householdId,
			userId: 'user-import',
			role: 'owner',
			lines: [{ name: 'Ost', location: 'fridge', unitPrice: '49.90', currency: 'SEK' }],
			inventoryService,
			purchasePatternService,
			pmfService,
			learningEngineService,
			eventType: 'receipt_parsed',
			storeLabel: 'Willys',
			purchasedAt: '2026-06-15'
		});

		expect(result.linesWithPrice).toBe(1);

		const purchaseLines = await integrationDb.db
			.select()
			.from(receiptPurchaseLineTable)
			.where(eq(receiptPurchaseLineTable.householdId, householdId));
		expect(purchaseLines).toHaveLength(1);
		expect(purchaseLines[0]).toMatchObject({
			productName: 'Ost',
			unitPrice: '49.90',
			currency: 'SEK',
			storeLabel: 'Willys',
			importBatchId: result.importBatchId
		});
		expect(purchaseLines[0]?.purchasedAt).toBeTruthy();
	});
});
