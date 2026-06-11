import { describe, expect, it } from 'vitest';
import { coerceReceiptPrice, parseReceiptLines } from './receipt-parse';

describe('coerceReceiptPrice', () => {
	it('normalizes Swedish comma decimals', () => {
		expect(coerceReceiptPrice('12,50')).toBe('12.50');
		expect(coerceReceiptPrice(' 3.9 ')).toBe('3.90');
		expect(coerceReceiptPrice(7)).toBe('7.00');
		expect(coerceReceiptPrice('')).toBeUndefined();
	});
});

describe('parseReceiptLines prices', () => {
	it('parses unit price, line total and currency when present', () => {
		expect(
			parseReceiptLines({
				lines: [
					{
						name: 'Mjölk',
						quantity: '1',
						unit: 'l',
						location: 'fridge',
						unitPrice: '15,95',
						lineTotal: '31,90',
						currency: 'sek'
					}
				]
			})
		).toEqual([
			{
				name: 'Mjölk',
				quantity: '1',
				unit: 'l',
				location: 'fridge',
				unitPrice: '15.95',
				lineTotal: '31.90',
				currency: 'SEK'
			}
		]);
	});
});
