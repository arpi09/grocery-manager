import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { PriceMemoryService } from './price-memory.service';
import { DrizzlePriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { receiptPurchaseLineTable, inventoryItemTable } from '$lib/infrastructure/db/schema';

describe('Price memory integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: PriceMemoryService;
	let purchasePatternRepository: DrizzlePurchasePatternRepository;
	const userId = 'user-price-memory';
	const householdId = 'household-price-memory';
	const householdOtherId = 'household-price-memory-other';
	const normalizedKey = normalizeReceiptProductName('Arla Mjölk 1L');

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		service = new PriceMemoryService(new DrizzlePriceMemoryRepository(integrationDb.db));
		purchasePatternRepository = new DrizzlePurchasePatternRepository(integrationDb.db);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({ id: householdId, members: [{ userId, role: 'owner' }] });
		await integrationDb.seedHousehold({ id: householdOtherId, members: [{ userId, role: 'owner' }] });
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('returns latest paid price in 12-month window', async () => {
		await integrationDb.db.insert(receiptPurchaseLineTable).values([
			{
				id: 'line-old',
				householdId,
				userId,
				importBatchId: 'batch-1',
				productName: 'Arla Mjölk 1L',
				normalizedKey,
				conceptKey: normalizedKey,
				location: 'fridge',
				unitPrice: '13.90',
				currency: 'SEK',
				storeLabel: 'ICA',
				purchasedAt: new Date('2025-10-01T10:00:00.000Z'),
				lineIndex: 0,
				importSource: 'receipt_scan'
			},
			{
				id: 'line-new',
				householdId,
				userId,
				importBatchId: 'batch-2',
				productName: 'Arla Mjölk 1L',
				normalizedKey,
				conceptKey: normalizedKey,
				location: 'fridge',
				unitPrice: '16.50',
				currency: 'SEK',
				storeLabel: 'Coop',
				purchasedAt: new Date('2026-02-01T10:00:00.000Z'),
				lineIndex: 0,
				importSource: 'receipt_scan'
			}
		]);
		expect(await service.getLastPaidPrice(householdId, normalizedKey)).toMatchObject({
			unitPrice: '16.50',
			storeLabel: 'Coop'
		});
	});

	it('returns null when unit price is missing', async () => {
		await integrationDb.db.insert(receiptPurchaseLineTable).values({
			id: 'line-no-price',
			householdId,
			userId,
			importBatchId: 'batch-3',
			productName: 'Arla Mjölk 1L',
			normalizedKey,
			conceptKey: normalizedKey,
			location: 'fridge',
			unitPrice: null,
			lineIndex: 0,
			importSource: 'receipt_scan'
		});
		expect(await service.getLastPaidPrice(householdId, normalizedKey)).toBeNull();
	});

	it('enforces household boundary for same normalized key', async () => {
		await integrationDb.db.insert(receiptPurchaseLineTable).values({
			id: 'line-other-household',
			householdId: householdOtherId,
			userId,
			importBatchId: 'batch-4',
			productName: 'Arla Mjölk 1L',
			normalizedKey,
			conceptKey: normalizedKey,
			location: 'fridge',
			unitPrice: '22.00',
			lineIndex: 0,
			importSource: 'receipt_scan'
		});
		expect(await service.getLastPaidPrice(householdId, normalizedKey)).toBeNull();
	});

	it('persists write path metadata with price from receipt import', async () => {
		await integrationDb.db.insert(inventoryItemTable).values({
			id: 'inv-milk',
			householdId,
			userId,
			name: 'Arla Mjölk 1L',
			location: 'fridge',
			quantity: '1',
			unit: 'l'
		});
		await purchasePatternRepository.insertLines([
			{
				householdId,
				userId,
				importBatchId: 'batch-write',
				productName: 'Arla Mjölk 1L',
				location: 'fridge',
				unitPrice: '18.90',
				lineIndex: 0,
				importSource: 'receipt_scan',
				inventoryItemId: 'inv-milk',
				matchSource: 'inventory_item',
				conceptKey: normalizedKey
			}
		]);
		expect((await service.getLastPaidPrice(householdId, normalizedKey))?.unitPrice).toBe('18.90');
		const rows = await integrationDb.db
			.select()
			.from(receiptPurchaseLineTable)
			.where(eq(receiptPurchaseLineTable.importBatchId, 'batch-write'));
		expect(rows[0]).toMatchObject({
			inventoryItemId: 'inv-milk',
			matchSource: 'inventory_item',
			importSource: 'receipt_scan',
			lineIndex: 0
		});
	});

	it('ignores duplicate line_index within the same import batch', async () => {
		const line = {
			householdId,
			userId,
			importBatchId: 'batch-dup',
			productName: 'Arla Mjölk 1L',
			location: 'fridge' as const,
			lineIndex: 0,
			importSource: 'receipt_scan' as const
		};
		await purchasePatternRepository.insertLines([{ ...line, unitPrice: '13.90' }]);
		await purchasePatternRepository.insertLines([{ ...line, unitPrice: '99.00' }]);
		const rows = await integrationDb.db
			.select()
			.from(receiptPurchaseLineTable)
			.where(eq(receiptPurchaseLineTable.importBatchId, 'batch-dup'));
		expect(rows).toHaveLength(1);
		expect(rows[0].unitPrice).toBe('13.90');
	});

	it('builds cross-store timeline for the same normalized key', async () => {
		await integrationDb.db.insert(receiptPurchaseLineTable).values([
			{
				id: 'line-ica',
				householdId,
				userId,
				importBatchId: 'batch-ica',
				productName: 'Arla Mjölk 1L',
				normalizedKey,
				conceptKey: normalizedKey,
				location: 'fridge',
				unitPrice: '14.90',
				storeLabel: 'ICA',
				purchasedAt: new Date('2026-01-01T10:00:00.000Z'),
				lineIndex: 0,
				importSource: 'receipt_scan'
			},
			{
				id: 'line-coop',
				householdId,
				userId,
				importBatchId: 'batch-coop',
				productName: 'Arla Mjölk 1L',
				normalizedKey,
				conceptKey: normalizedKey,
				location: 'fridge',
				unitPrice: '15.90',
				storeLabel: 'Coop',
				purchasedAt: new Date('2026-02-01T10:00:00.000Z'),
				lineIndex: 0,
				importSource: 'receipt_scan'
			}
		]);
		const timeline = await service.getTimelineByKey(householdId, normalizedKey);
		expect(timeline).toHaveLength(2);
		expect(timeline.map((entry) => entry.storeLabel).sort()).toEqual(['Coop', 'ICA']);
	});

	it('search does not false-merge distinct products', async () => {
		const oatKey = normalizeReceiptProductName('Oatly Havremjölk');
		await integrationDb.db.insert(receiptPurchaseLineTable).values([
			{
				id: 'line-arla',
				householdId,
				userId,
				importBatchId: 'batch-arla',
				productName: 'Arla Mjölk 1L',
				normalizedKey,
				conceptKey: normalizedKey,
				location: 'fridge',
				unitPrice: '16.50',
				lineIndex: 0,
				importSource: 'receipt_scan'
			},
			{
				id: 'line-oatly',
				householdId,
				userId,
				importBatchId: 'batch-oatly',
				productName: 'Oatly Havremjölk',
				normalizedKey: oatKey,
				conceptKey: oatKey,
				location: 'fridge',
				unitPrice: '24.90',
				lineIndex: 0,
				importSource: 'receipt_scan'
			}
		]);
		const results = await service.search(householdId, 'mjölk');
		expect(results.map((result) => result.normalizedKey).sort()).toEqual([normalizedKey, oatKey].sort());
	});
});
