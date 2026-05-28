import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/infrastructure/barcode/open-food-facts.client', () => ({
	fetchProductByBarcode: vi.fn()
}));

import { fetchProductByBarcode } from '$lib/infrastructure/barcode/open-food-facts.client';
import { BarcodeLookupService } from './barcode-lookup.service';

describe('BarcodeLookupService', () => {
	let service: BarcodeLookupService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new BarcodeLookupService();
	});

	it('returns product when barcode is found', async () => {
		const product = {
			barcode: '7310862000003',
			name: 'Organic Milk',
			quantity: '1',
			unit: 'L',
			notes: 'Brand: Test Dairy'
		};
		vi.mocked(fetchProductByBarcode).mockResolvedValue(product);

		const result = await service.lookup('7310862000003');

		expect(result).toEqual(product);
		expect(fetchProductByBarcode).toHaveBeenCalledWith('7310862000003');
	});
});
