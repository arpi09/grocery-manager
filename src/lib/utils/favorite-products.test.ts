import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getFavoriteProduct,
	getFavoriteProducts,
	removeFavoriteProduct,
	saveFavoriteProduct
} from './favorite-products';

describe('favorite-products', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('window', {});
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns empty list when nothing is stored', () => {
		expect(getFavoriteProducts()).toEqual([]);
	});

	it('saves and retrieves a favorite product by barcode', () => {
		saveFavoriteProduct({
			barcode: '7310862000003',
			name: 'Mjölk 3%',
			quantity: '1',
			unit: 'l',
			notes: null
		});

		const product = getFavoriteProduct('7310862000003');
		expect(product?.name).toBe('Mjölk 3%');
		expect(product?.quantity).toBe('1');
		expect(product?.unit).toBe('l');
	});

	it('moves updated product to front and normalizes barcode', () => {
		saveFavoriteProduct({
			barcode: '7310862000003',
			name: 'Mjölk',
			quantity: '1',
			unit: null,
			notes: null,
			savedAt: 100
		});
		saveFavoriteProduct({
			barcode: '731-0862-000003',
			name: 'Mjölk 3%',
			quantity: '1.5',
			unit: 'l',
			notes: null,
			savedAt: 200
		});

		const products = getFavoriteProducts();
		expect(products).toHaveLength(1);
		expect(products[0]?.name).toBe('Mjölk 3%');
		expect(products[0]?.quantity).toBe('1.5');
	});

	it('ignores invalid barcodes and empty names', () => {
		saveFavoriteProduct({
			barcode: '123',
			name: 'Too short',
			quantity: '1',
			unit: null,
			notes: null
		});
		saveFavoriteProduct({
			barcode: '7310862000003',
			name: '   ',
			quantity: '1',
			unit: null,
			notes: null
		});

		expect(getFavoriteProducts()).toEqual([]);
	});

	it('removes a favorite product', () => {
		saveFavoriteProduct({
			barcode: '7310862000003',
			name: 'Mjölk',
			quantity: '1',
			unit: null,
			notes: null
		});

		removeFavoriteProduct('7310862000003');
		expect(getFavoriteProduct('7310862000003')).toBeNull();
	});
});
