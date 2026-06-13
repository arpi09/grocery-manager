import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleHouseholdFavoriteProductRepository } from '$lib/infrastructure/repositories/household-favorite-product.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

let integrationDb: IntegrationDbContext;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

const HOUSEHOLD_ID = 'house-favorites';

describe('DrizzleHouseholdFavoriteProductRepository', () => {
	let repository: DrizzleHouseholdFavoriteProductRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleHouseholdFavoriteProductRepository(integrationDb.db);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.client.exec(
			`INSERT INTO "household" (id, name) VALUES ('${HOUSEHOLD_ID}', 'Test household');`
		);
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('upserts and finds by barcode and normalized key', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'mjölk 3',
			barcode: '7310862000003',
			displayName: 'Mjölk 3%',
			quantity: '1',
			unit: 'l',
			notes: null
		});

		const byBarcode = await repository.findByBarcode(HOUSEHOLD_ID, '7310862000003');
		expect(byBarcode?.displayName).toBe('Mjölk 3%');

		const byKey = await repository.findByKey(HOUSEHOLD_ID, 'mjölk 3');
		expect(byKey?.barcode).toBe('7310862000003');
	});

	it('lists favorites for household only', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'mjolk',
			barcode: '7310862000003',
			displayName: 'Mjölk',
			quantity: '1',
			unit: null,
			notes: null
		});
		await integrationDb.client.exec(
			`INSERT INTO "household" (id, name) VALUES ('other-house', 'Other');`
		);
		await repository.upsert({
			householdId: 'other-house',
			normalizedKey: 'brod',
			barcode: '7310862000004',
			displayName: 'Bröd',
			quantity: '1',
			unit: null,
			notes: null
		});

		const listed = await repository.listByHousehold(HOUSEHOLD_ID);
		expect(listed).toHaveLength(1);
		expect(listed[0]?.normalizedKey).toBe('mjolk');
	});

	it('deletes by barcode and drops oldest when at capacity helper is used', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'a',
			barcode: '7310862000001',
			displayName: 'A',
			quantity: '1',
			unit: null,
			notes: null
		});
		await new Promise((resolve) => setTimeout(resolve, 5));
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'b',
			barcode: '7310862000002',
			displayName: 'B',
			quantity: '1',
			unit: null,
			notes: null
		});

		expect(await repository.deleteByBarcode(HOUSEHOLD_ID, '7310862000001')).toBe(true);
		expect(await repository.findByBarcode(HOUSEHOLD_ID, '7310862000001')).toBeNull();

		expect(await repository.deleteOldest(HOUSEHOLD_ID)).toBe(true);
		expect(await repository.listByHousehold(HOUSEHOLD_ID)).toHaveLength(0);
	});
});
