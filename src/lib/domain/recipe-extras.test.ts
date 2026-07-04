import { describe, expect, it } from 'vitest';
import {
	buildPseudoInventoryForExtras,
	MAX_RECIPE_EXTRA_ITEMS,
	parseRecipeExtraItems
} from './recipe-extras';

describe('parseRecipeExtraItems', () => {
	it('trims, dedupes case-insensitively and drops empties', () => {
		expect(parseRecipeExtraItems([' Kyckling ', 'kyckling', '', 'Ris', 42, null])).toEqual([
			'Kyckling',
			'Ris'
		]);
	});

	it('caps count and item length', () => {
		const many = Array.from({ length: 20 }, (_, i) => `Vara ${i}`);
		expect(parseRecipeExtraItems(many)).toHaveLength(MAX_RECIPE_EXTRA_ITEMS);
		expect(parseRecipeExtraItems(['x'.repeat(100)])[0]).toHaveLength(40);
	});

	it('returns empty for non-arrays', () => {
		expect(parseRecipeExtraItems('kyckling')).toEqual([]);
		expect(parseRecipeExtraItems(undefined)).toEqual([]);
	});
});

describe('buildPseudoInventoryForExtras', () => {
	it('builds recipe-compatible pantry rows', () => {
		const [item] = buildPseudoInventoryForExtras(['Kyckling'], 'hh-1', 'user-1');
		expect(item).toMatchObject({
			name: 'Kyckling',
			householdId: 'hh-1',
			userId: 'user-1',
			location: 'cupboard',
			quantity: '1',
			expiresOn: null
		});
		expect(item.createdAt).toBeInstanceOf(Date);
	});
});
