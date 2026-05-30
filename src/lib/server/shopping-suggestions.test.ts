import { describe, expect, it } from 'vitest';
import {
	normalizeShoppingItemName,
	parseShoppingSuggestions,
	suggestionToListItem
} from './shopping-suggestions';

describe('parseShoppingSuggestions', () => {
	it('parses valid items and drops incomplete rows', () => {
		const items = parseShoppingSuggestions({
			note: 'Tips',
			items: [
				{
					name: 'Mjölk',
					quantity: '1 l',
					category: 'Mejeri',
					reason: 'Håller på att ta slut',
					priority: 'high'
				},
				{ name: '', quantity: '1 st', category: 'Skafferi', reason: 'x', priority: 'low' },
				{
					name: 'Banana',
					quantity: '6 st',
					category: 'Unknown',
					reason: 'För frukost',
					priority: 'medium'
				}
			]
		});

		expect(items).toHaveLength(2);
		expect(items[0]?.name).toBe('Mjölk');
		expect(items[1]?.category).toBe('Övrigt');
	});

	it('maps suggestions to list item inputs', () => {
		const item = suggestionToListItem({
			name: 'Mjölk',
			quantity: '1 l',
			category: 'Mejeri',
			reason: 'Behövs',
			priority: 'high'
		});
		expect(item).toEqual({ name: 'Mjölk', quantity: '1 l', unit: null });
	});
});

describe('normalizeShoppingItemName', () => {
	it('trims and lowercases for duplicate checks', () => {
		expect(normalizeShoppingItemName('  Mjölk  ')).toBe('mjölk');
	});
});
