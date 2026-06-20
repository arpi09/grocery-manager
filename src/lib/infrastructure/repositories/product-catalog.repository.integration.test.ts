import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzleProductCatalogRepository } from './product-catalog.repository';

describe('DrizzleProductCatalogRepository', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzleProductCatalogRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleProductCatalogRepository(integrationDb.db);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('upserts catalog rows by barcode', async () => {
		await repository.upsert({
			barcode: '7310862000003',
			name: 'Organic Milk',
			imageUrl: 'https://images.openfoodfacts.org/small.jpg',
			source: 'open_food_facts'
		});

		const updated = await repository.upsert({
			barcode: '7310862000003',
			name: 'Organic Milk 1L',
			imageUrl: 'https://images.openfoodfacts.org/updated.jpg',
			source: 'open_food_facts'
		});

		expect(updated.name).toBe('Organic Milk 1L');
		expect(updated.imageUrl).toBe('https://images.openfoodfacts.org/updated.jpg');

		const rows = await repository.findByBarcodes(['7310862000003']);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.source).toBe('open_food_facts');
	});

	it('findByBarcodes returns matching image URLs', async () => {
		await repository.upsert({
			barcode: '7310862000003',
			name: 'Organic Milk',
			imageUrl: 'https://images.openfoodfacts.org/small.jpg'
		});

		const rows = await repository.findByBarcodes(['7310862000003', '0000000000000']);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.imageUrl).toBe('https://images.openfoodfacts.org/small.jpg');
	});
});
