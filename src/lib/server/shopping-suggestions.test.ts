import { describe, expect, it } from 'vitest';
import {
	normalizeShoppingItemName,
	parseShoppingSuggestions,
	parseSuggestionQuantity,
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
		expect(item).toEqual({ name: 'Mjölk', quantity: '1', unit: 'l' });
	});
});

describe('parseSuggestionQuantity', () => {
	it('splits number and unit for common Swedish grocery strings', () => {
		expect(parseSuggestionQuantity('1 st')).toEqual({ quantity: '1', unit: 'st' });
		expect(parseSuggestionQuantity('1 kg')).toEqual({ quantity: '1', unit: 'kg' });
		expect(parseSuggestionQuantity('500 g')).toEqual({ quantity: '500', unit: 'g' });
		expect(parseSuggestionQuantity('2,5 l')).toEqual({ quantity: '2.5', unit: 'l' });
	});
});

describe('normalizeShoppingItemName', () => {
	it('trims and lowercases for duplicate checks', () => {
		expect(normalizeShoppingItemName('  Mjölk  ')).toBe('mjölk');
	});
});
