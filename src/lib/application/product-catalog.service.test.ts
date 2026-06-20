import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductCatalogService } from './product-catalog.service';
import type { IProductCatalogRepository } from '$lib/infrastructure/repositories/product-catalog.repository';

describe('ProductCatalogService', () => {
	let repository: IProductCatalogRepository;
	let service: ProductCatalogService;

	beforeEach(() => {
		repository = {
			upsert: vi.fn(),
			findByBarcodes: vi.fn()
		};
		service = new ProductCatalogService(repository);
	});

	it('enriches inventory items with catalog image URLs', async () => {
		vi.mocked(repository.findByBarcodes).mockResolvedValue([
			{
				barcode: '7310862000003',
				name: 'Organic Milk',
				imageUrl: 'https://images.openfoodfacts.org/small.jpg',
				source: 'open_food_facts',
				updatedAt: new Date()
			}
		]);

		const enriched = await service.enrichInventoryItems([
			{ barcode: '7310862000003' },
			{ barcode: null },
			{ barcode: '0000000000000' }
		]);

		expect(enriched[0]?.imageUrl).toBe('https://images.openfoodfacts.org/small.jpg');
		expect(enriched[1]?.imageUrl).toBeNull();
		expect(enriched[2]?.imageUrl).toBeNull();
	});

	it('upserts barcode products into the catalog', async () => {
		await service.upsertFromBarcodeProduct({
			barcode: '7310862000003',
			name: 'Organic Milk',
			quantity: '1',
			unit: 'L',
			notes: null,
			imageUrl: 'https://images.openfoodfacts.org/small.jpg'
		});

		expect(repository.upsert).toHaveBeenCalledWith({
			barcode: '7310862000003',
			name: 'Organic Milk',
			imageUrl: 'https://images.openfoodfacts.org/small.jpg',
			source: 'open_food_facts'
		});
	});
});
