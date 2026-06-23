import { describe, expect, it } from 'vitest';
import {
	computeLowStockItems,
	dedupeShoppingSuggestionsAgainstInventory,
	normalizeShoppingItemName,
	parseShoppingSuggestions,
	parseSuggestionQuantity,
	suggestionToListItem
} from './shopping-suggestions';
import type { InventoryItem } from '$lib/domain/inventory-item';

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

describe('computeLowStockItems', () => {
	it('flags items below 1 unit', () => {
		const inventory = [
			{ name: 'Mjölk', quantity: '0.5', unit: 'l' },
			{ name: 'Pasta', quantity: '2', unit: 'kg' }
		] as InventoryItem[];
		expect(computeLowStockItems(inventory)).toHaveLength(1);
		expect(computeLowStockItems(inventory)[0]?.name).toBe('Mjölk');
	});
});

describe('dedupeShoppingSuggestionsAgainstInventory', () => {
	it('removes suggestions already well stocked', () => {
		const inventory = [{ name: 'Mjölk', quantity: '3', unit: 'l' }] as InventoryItem[];
		const suggestions = [
			{
				name: 'Mjölk',
				quantity: '1 l',
				category: 'Mejeri' as const,
				reason: 'Behövs',
				priority: 'high' as const
			}
		];
		expect(dedupeShoppingSuggestionsAgainstInventory(suggestions, inventory)).toHaveLength(0);
	});
});
