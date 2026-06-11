import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PriceMemoryService } from './price-memory.service';
import { DrizzlePriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { receiptPurchaseLineTable } from '$lib/infrastructure/db/schema';

describe('Price memory integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: PriceMemoryService;
	const userId = 'user-price-memory';
	const householdId = 'household-price-memory';
	const householdOtherId = 'household-price-memory-other';
	const normalizedKey = normalizeReceiptProductName('Arla Mjölk 1L');

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		service = new PriceMemoryService(new DrizzlePriceMemoryRepository(integrationDb.db));
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({
			id: householdId,
			members: [{ userId, role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: householdOtherId,
			members: [{ userId, role: 'owner' }]
		});
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
				location: 'fridge',
				quantity: '1',
				unit: 'l',
				unitPrice: '13.90',
				currency: 'SEK',
				lineTotal: '13.90',
				storeLabel: 'ICA',
				purchasedAt: new Date('2025-10-01T10:00:00.000Z')
			},
			{
				id: 'line-new',
				householdId,
				userId,
				importBatchId: 'batch-2',
				productName: 'Arla Mjölk 1L',
				normalizedKey,
				location: 'fridge',
				quantity: '1',
				unit: 'l',
				unitPrice: '16.50',
				currency: 'SEK',
				lineTotal: '16.50',
				storeLabel: 'Coop',
				purchasedAt: new Date('2026-02-01T10:00:00.000Z')
			}
		]);

		const lastPaid = await service.getLastPaidPrice(householdId, normalizedKey);
		expect(lastPaid).toMatchObject({
			normalizedKey,
			unitPrice: '16.50',
			currency: 'SEK',
			lineTotal: '16.50',
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
			location: 'fridge',
			quantity: '1',
			unit: 'l',
			unitPrice: null,
			currency: 'SEK',
			lineTotal: null
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
			location: 'fridge',
			quantity: '1',
			unit: 'l',
			unitPrice: '22.00',
			currency: 'SEK',
			lineTotal: '22.00',
			storeLabel: 'Lidl'
		});

		expect(await service.getLastPaidPrice(householdId, normalizedKey)).toBeNull();
	});
});
