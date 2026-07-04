import { describe, expect, it } from 'vitest';
import { MAX_UNPACK_ROWS, parseUnpackRows } from './shopping-unpack';

describe('parseUnpackRows', () => {
	it('parses valid rows and applies defaults', () => {
		const rows = parseUnpackRows(
			JSON.stringify([
				{ shoppingItemId: 'a1', name: 'Mjölk', location: 'fridge', quantity: '2', unit: 'l' },
				{ shoppingItemId: null, name: '  Glass  ', location: 'freezer', quantity: '', unit: '' }
			])
		);

		expect(rows).toEqual([
			{ shoppingItemId: 'a1', name: 'Mjölk', location: 'fridge', quantity: '2', unit: 'l' },
			{ shoppingItemId: null, name: 'Glass', location: 'freezer', quantity: '1', unit: null }
		]);
	});

	it('rejects malformed input', () => {
		expect(parseUnpackRows(null)).toBeNull();
		expect(parseUnpackRows('')).toBeNull();
		expect(parseUnpackRows('not json')).toBeNull();
		expect(parseUnpackRows(JSON.stringify([]))).toBeNull();
		expect(parseUnpackRows(JSON.stringify([{ name: '', location: 'fridge' }]))).toBeNull();
		expect(parseUnpackRows(JSON.stringify([{ name: 'X', location: 'garage' }]))).toBeNull();
		expect(parseUnpackRows(JSON.stringify(['x']))).toBeNull();
	});

	it('caps the number of rows', () => {
		const tooMany = Array.from({ length: MAX_UNPACK_ROWS + 1 }, (_, i) => ({
			name: `Vara ${i}`,
			location: 'cupboard'
		}));
		expect(parseUnpackRows(JSON.stringify(tooMany))).toBeNull();
	});

	it('truncates oversized field values', () => {
		const rows = parseUnpackRows(
			JSON.stringify([{ name: 'x'.repeat(200), location: 'fridge', quantity: '1'.repeat(40) }])
		);
		expect(rows?.[0].name).toHaveLength(120);
		expect(rows?.[0].quantity).toHaveLength(20);
	});
});
