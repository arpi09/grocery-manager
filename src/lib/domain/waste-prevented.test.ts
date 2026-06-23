import { describe, expect, it } from 'vitest';
import { buildWastePreventedSnapshot, startOfCalendarMonth } from './waste-prevented';

describe('waste-prevented', () => {
	it('sums consumed item value as prevented waste', () => {
		const snapshot = buildWastePreventedSnapshot(
			[
				{ productName: 'Mjölk', eventType: 'consumed' },
				{ productName: 'Mjölk', eventType: 'consumed' },
				{ productName: 'Bröd', eventType: 'discarded' }
			],
			'sv',
			new Date('2026-06-15')
		);

		expect(snapshot.hasData).toBe(true);
		expect(snapshot.consumedCount).toBe(2);
		expect(snapshot.preventedSek).toBeGreaterThan(0);
		expect(snapshot.monthLabel.length).toBeGreaterThan(0);
	});

	it('returns start of calendar month', () => {
		const start = startOfCalendarMonth(new Date('2026-06-15T12:00:00'));
		expect(start.getMonth()).toBe(5);
		expect(start.getDate()).toBe(1);
	});
});
