import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/infrastructure/barcode/open-food-facts.client', () => ({
	fetchProductByBarcode: vi.fn()
}));

import { fetchProductByBarcode } from '$lib/infrastructure/barcode/open-food-facts.client';
import { BarcodeLookupService, BarcodeNotFoundError } from './barcode-lookup.service';
import { unknownBarcodeProductName } from '$lib/domain/barcode-product';

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
		expect(fetchProductByBarcode).toHaveBeenCalledWith('7310862000003', 'sv');
	});

	it('lookupWithFallback returns found:true when product exists', async () => {
		const product = {
			barcode: '7310862000003',
			name: 'Organic Milk',
			quantity: '1',
			unit: 'L',
			notes: null
		};
		vi.mocked(fetchProductByBarcode).mockResolvedValue(product);

		const result = await service.lookupWithFallback('731-086-2000003');

		expect(result).toEqual({ found: true, product });
		expect(fetchProductByBarcode).toHaveBeenCalledWith('7310862000003', 'sv');
	});

	it('lookupWithFallback returns found:false with unknown name when not in database', async () => {
		vi.mocked(fetchProductByBarcode).mockResolvedValue(null);

		const result = await service.lookupWithFallback('0000000000000');

		expect(result.found).toBe(false);
		expect(result.product.barcode).toBe('0000000000000');
		expect(result.product.name).toBe(unknownBarcodeProductName('0000000000000'));
	});

	it('lookupWithFallback uses Swedish override when Open Food Facts misses', async () => {
		vi.mocked(fetchProductByBarcode).mockResolvedValue(null);

		const result = await service.lookupWithFallback('7310100683519');

		expect(result.found).toBe(true);
		expect(result.product.name).toBe('Felix Ketchup');
		expect(result.swedishOverrideUsed).toBe(true);
	});

	it('lookupWithFallback applies Swedish override name on top of Open Food Facts', async () => {
		vi.mocked(fetchProductByBarcode).mockResolvedValue({
			barcode: '7310100683519',
			name: 'Ketchup',
			quantity: '1',
			unit: null,
			notes: null
		});

		const result = await service.lookupWithFallback('7310100683519');

		expect(result.found).toBe(true);
		expect(result.product.name).toBe('Felix Ketchup');
		expect(result.product.notes).toBe('Brand: Felix');
		expect(result.swedishOverrideUsed).toBe(true);
	});

	it('lookupWithFallback does not flag override for non-sv locale', async () => {
		vi.mocked(fetchProductByBarcode).mockResolvedValue(null);

		const result = await service.lookupWithFallback('7310100683519', 'en');

		expect(result.found).toBe(false);
		expect(result.swedishOverrideUsed).toBeUndefined();
	});

	it('lookupWithFallback throws for short barcodes', async () => {
		await expect(service.lookupWithFallback('123')).rejects.toBeInstanceOf(BarcodeNotFoundError);
	});

	it('lookup throws when product is not found', async () => {
		vi.mocked(fetchProductByBarcode).mockResolvedValue(null);

		await expect(service.lookup('7310862000003')).rejects.toBeInstanceOf(BarcodeNotFoundError);
	});
});
