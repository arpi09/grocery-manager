import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	filterInventoryForRecipes,
	isExcludedFromRecipes
} from './recipe-inventory-filter';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: '1',
		householdId: 'h1',
		userId: 'u1',
		name: 'Mjölk',
		location: 'fridge',
		quantity: '1',
		unit: 'l',
		expiresOn: null,
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

describe('isExcludedFromRecipes', () => {
	it('excludes pet food, flowers, and cleaning products', () => {
		expect(isExcludedFromRecipes('Hundmat')).toBe(true);
		expect(isExcludedFromRecipes('Rosor')).toBe(true);
		expect(isExcludedFromRecipes('Diskmedel')).toBe(true);
		expect(isExcludedFromRecipes('Kattsand')).toBe(true);
		expect(isExcludedFromRecipes('Bukett tulpaner')).toBe(true);
	});

	it('keeps normal human food', () => {
		expect(isExcludedFromRecipes('Mjölk')).toBe(false);
		expect(isExcludedFromRecipes('Blomkål')).toBe(false);
		expect(isExcludedFromRecipes('Rosmarin')).toBe(false);
	});

	it('uses notes heuristics case-insensitively', () => {
		expect(isExcludedFromRecipes('Foder', 'Till hunden')).toBe(true);
		expect(isExcludedFromRecipes('Servetter', 'STÄD')).toBe(true);
		expect(isExcludedFromRecipes('Grädde', 'Till matlagning')).toBe(false);
	});
});

describe('filterInventoryForRecipes', () => {
	it('returns only recipe-suitable items', () => {
		const filtered = filterInventoryForRecipes([
			makeItem({ name: 'Hundmat' }),
			makeItem({ id: '2', name: 'Mjölk' }),
			makeItem({ id: '3', name: 'Rosor' })
		]);
		expect(filtered.map((item) => item.name)).toEqual(['Mjölk']);
	});
});
