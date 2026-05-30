import { describe, expect, it } from 'vitest';
import {
	formatShoppingListExport,
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
