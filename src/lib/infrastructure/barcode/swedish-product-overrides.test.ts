import { describe, expect, it } from 'vitest';
import {
	applySwedishProductOverride,
	getSwedishProductOverride,
	listSwedishOverrideBarcodes,
	swedishOverrideToProduct,
	SWEDISH_PRODUCT_OVERRIDES
} from './swedish-product-overrides';

describe('swedish product overrides', () => {
	it('normalizes barcode before lookup', () => {
		expect(getSwedishProductOverride('731-010-0683519')?.name).toBe('Felix Ketchup');
	});

	it('returns null for unknown barcodes', () => {
		expect(getSwedishProductOverride('0000000000000')).toBeNull();
	});

	it('merges override fields onto an existing product', () => {
		expect(
			applySwedishProductOverride(
				{
					barcode: '7310100683519',
					name: 'Ketchup',
					quantity: '2',
					unit: 'st',
					notes: null
				},
				{ name: 'Felix Ketchup', quantity: '1', unit: null, notes: 'Brand: Felix' }
			)
		).toEqual({
			barcode: '7310100683519',
			name: 'Felix Ketchup',
			quantity: '1',
			unit: null,
			notes: 'Brand: Felix'
		});
	});

	it('builds a product from override only', () => {
		expect(swedishOverrideToProduct('7310100683519', { name: 'Felix Ketchup' })).toEqual({
			barcode: '7310100683519',
			name: 'Felix Ketchup',
			quantity: '1',
			unit: null,
			notes: null
		});
	});

	it('lists curated override barcodes for ICA, Willys and Coop staples', () => {
		const barcodes = listSwedishOverrideBarcodes();
		expect(barcodes.length).toBeGreaterThanOrEqual(12);

		const stores = new Set(
			barcodes.map((code) => SWEDISH_PRODUCT_OVERRIDES[code]?.store).filter(Boolean)
		);
		expect(stores.has('ica')).toBe(true);
		expect(stores.has('willys')).toBe(true);
		expect(stores.has('coop')).toBe(true);
	});
});
