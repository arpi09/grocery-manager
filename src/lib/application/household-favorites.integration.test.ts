import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdFavoritesService } from '$lib/application/household-favorites.service';
import { DrizzleHouseholdFavoriteProductRepository } from '$lib/infrastructure/repositories/household-favorite-product.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

let integrationDb: IntegrationDbContext;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

describe('Household favorites integration', () => {
	let repository: DrizzleHouseholdFavoriteProductRepository;
	let service: HouseholdFavoritesService;
	let householdId: string;
	let otherHouseholdId: string;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleHouseholdFavoriteProductRepository(integrationDb.db);
		service = new HouseholdFavoritesService(repository);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		householdId = await integrationDb.seedHousehold({
			members: [{ userId: 'user-1', role: 'owner' }]
		});
		otherHouseholdId = await integrationDb.seedHousehold({
			id: 'house-other',
			members: [{ userId: 'user-1', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('keeps favorites scoped to household', async () => {
		await service.save(householdId, {
			barcode: '7310862000003',
			displayName: 'Mjölk',
			quantity: '1',
			unit: 'l',
			notes: null
		});
		await service.save(otherHouseholdId, {
			barcode: '7310862000003',
			displayName: 'Other milk',
			quantity: '2',
			unit: 'l',
			notes: null
		});

		const favorites = await service.list(householdId);
		expect(favorites).toHaveLength(1);
		expect(favorites[0]?.displayName).toBe('Mjölk');
	});

	it('updates renamed favorite for same barcode', async () => {
		await service.save(householdId, {
			barcode: '7310862000003',
			displayName: 'Mjölk',
			quantity: '1',
			unit: null,
			notes: null
		});
		await service.save(householdId, {
			barcode: '7310862000003',
			displayName: 'Arla Mjölk 3%',
			quantity: '1.5',
			unit: 'l',
			notes: 'Favorit'
		});

		const favorites = await service.list(householdId);
		expect(favorites).toHaveLength(1);
		expect(favorites[0]?.displayName).toBe('Arla Mjölk 3%');
		expect(favorites[0]?.quantity).toBe('1.5');
	});
});
