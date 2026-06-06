import { describe, expect, it } from 'vitest';
import { parseAddShoppingListItem } from './shopping-list.schemas';

describe('parseAddShoppingListItem', () => {
	it('splits combined quantity and unit from the quantity field', () => {
		const result = parseAddShoppingListItem({
			name: 'Basilika',
			quantity: '12 st',
			unit: ''
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ name: 'Basilika', quantity: '12', unit: 'st' });
		}
	});

	it('keeps an explicit unit field when provided', () => {
		const result = parseAddShoppingListItem({
			name: 'Mjölk',
			quantity: '500',
			unit: 'g'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ name: 'Mjölk', quantity: '500', unit: 'g' });
		}
	});
});
