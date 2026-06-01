import { describe, expect, it } from 'vitest';
import {
	applySwedishProductOverride,
	getSwedishProductOverride,
	swedishOverrideToProduct
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
});
