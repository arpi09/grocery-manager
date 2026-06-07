import { describe, expect, it } from 'vitest';
import {
	formatAnyListExportLine,
	formatOurGroceriesExportLine,
	formatShoppingListExport,
	formatShoppingListExportByFormat,
	formatShoppingListExportLine
} from './shopping-list-export';

describe('formatShoppingListExportLine', () => {
	it('returns name only when no quantity', () => {
		expect(formatShoppingListExportLine({ name: 'Mjölk' })).toBe('Mjölk');
	});

	it('includes quantity without unit', () => {
		expect(formatShoppingListExportLine({ name: 'Ägg', quantity: '12' })).toBe('12 Ägg');
	});

	it('includes quantity and unit', () => {
		expect(
			formatShoppingListExportLine({ name: 'Mjölk', quantity: '1', unit: 'L' })
		).toBe('1 L Mjölk');
	});

	it('ignores empty quantity string', () => {
		expect(formatShoppingListExportLine({ name: 'Bröd', quantity: '' })).toBe('Bröd');
	});
});

describe('formatAnyListExportLine', () => {
	it('returns name only when no quantity', () => {
		expect(formatAnyListExportLine({ name: 'Milk' })).toBe('Milk');
	});

	it('appends quantity and unit in parentheses', () => {
		expect(formatAnyListExportLine({ name: 'Milk', quantity: '2', unit: 'L' })).toBe(
			'Milk (2 L)'
		);
	});

	it('appends quantity without unit in parentheses', () => {
		expect(formatAnyListExportLine({ name: 'Eggs', quantity: '12' })).toBe('Eggs (12)');
	});
});

describe('formatOurGroceriesExportLine', () => {
	it('matches AnyList plain-text shape', () => {
		expect(formatOurGroceriesExportLine({ name: 'Bread', quantity: '1' })).toBe('Bread (1)');
	});
});

describe('formatShoppingListExport', () => {
	it('joins unchecked items with newlines', () => {
		const text = formatShoppingListExport([
			{ name: 'Mjölk', quantity: '2', unit: 'L' },
			{ name: 'Bröd' },
			{ name: 'Smör', checked: true }
		]);
		expect(text).toBe('2 L Mjölk\nBröd');
	});

	it('returns empty string when all items are checked', () => {
		expect(
			formatShoppingListExport([{ name: 'Mjölk', checked: true }])
		).toBe('');
	});

	it('returns empty string for empty input', () => {
		expect(formatShoppingListExport([])).toBe('');
	});

	it('preserves list order', () => {
		const text = formatShoppingListExport([
			{ name: 'Banan' },
			{ name: 'Yoghurt', quantity: '4' }
		]);
		expect(text).toBe('Banan\n4 Yoghurt');
	});
});

describe('formatShoppingListExportByFormat', () => {
	it('uses Bring format by default path', () => {
		const text = formatShoppingListExportByFormat([{ name: 'Milk', quantity: '1', unit: 'L' }], 'bring');
		expect(text).toBe('1 L Milk');
	});

	it('uses AnyList format', () => {
		const text = formatShoppingListExportByFormat(
			[
				{ name: 'Milk', quantity: '1', unit: 'L' },
				{ name: 'Bread', checked: true }
			],
			'anylist'
		);
		expect(text).toBe('Milk (1 L)');
	});

	it('uses OurGroceries format', () => {
		const text = formatShoppingListExportByFormat([{ name: 'Eggs' }], 'ourgroceries');
		expect(text).toBe('Eggs');
	});
});
