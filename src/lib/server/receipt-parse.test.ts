import { describe, expect, it } from 'vitest';
import { parseReceiptLines } from './receipt-parse';

describe('parseReceiptLines', () => {
	it('parses structured line objects', () => {
		expect(
			parseReceiptLines({
				lines: [
					{ name: '  Mjölk  ', quantity: ' 2 ' },
					{ name: 'Bröd' }
				]
			})
		).toEqual([
			{ name: 'Mjölk', quantity: '2' },
			{ name: 'Bröd' }
		]);
	});

	it('skips invalid rows', () => {
		expect(parseReceiptLines({ lines: [{ name: '   ' }, { quantity: '1' }] })).toEqual([]);
	});
});
