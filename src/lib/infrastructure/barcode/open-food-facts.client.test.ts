import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProductByBarcode } from './open-food-facts.client';

describe('fetchProductByBarcode', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('returns null for short barcodes', async () => {
		const result = await fetchProductByBarcode('123');
		expect(result).toBeNull();
	});

	it('maps Open Food Facts response to product', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					status: 1,
					product: {
						product_name: 'Organic Milk',
						brands: 'Test Dairy',
						quantity: '1 L'
					}
				})
			})
		);

		const result = await fetchProductByBarcode('7310862000003');
		expect(result).toEqual({
			barcode: '7310862000003',
			name: 'Organic Milk',
			quantity: '1',
			unit: 'L',
			notes: 'Brand: Test Dairy'
		});
	});
});
