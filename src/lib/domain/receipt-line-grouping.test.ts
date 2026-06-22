import { describe, expect, it } from 'vitest';
import { groupReceiptLines } from '$lib/domain/receipt-line-grouping';
import type { ReceiptLine } from '$lib/domain/receipt-line';

function line(overrides: Partial<ReceiptLine> & Pick<ReceiptLine, 'name'>): ReceiptLine {
	return {
		location: 'fridge',
		quantity: '1',
		unit: 'st',
		...overrides
	};
}

describe('groupReceiptLines', () => {
	it('merges duplicate rows with the same normalized name and location', () => {
		const { lines, mergedAwayCount } = groupReceiptLines([
			line({ name: 'ICA Mjölk 1L', quantity: '1' }),
			line({ name: 'Arla Mjölk 1L', quantity: '1' }),
			line({ name: 'Bröd', location: 'cupboard' })
		]);

		expect(lines).toHaveLength(2);
		expect(mergedAwayCount).toBe(1);
		expect(lines[0]).toMatchObject({
			name: 'ICA Mjölk 1L',
			quantity: '2',
			groupedCount: 2
		});
		expect(lines[0].groupedFrom).toHaveLength(2);
	});

	it('keeps separate locations apart', () => {
		const { lines, mergedAwayCount } = groupReceiptLines([
			line({ name: 'Kyckling', location: 'fridge' }),
			line({ name: 'Kyckling', location: 'freezer' })
		]);

		expect(lines).toHaveLength(2);
		expect(mergedAwayCount).toBe(0);
	});

	it('returns single-line groups without groupedFrom', () => {
		const { lines } = groupReceiptLines([line({ name: 'Banan' })]);
		expect(lines[0].groupedCount).toBe(1);
		expect(lines[0].groupedFrom).toBeUndefined();
	});
});
