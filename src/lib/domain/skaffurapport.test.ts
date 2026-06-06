import { describe, expect, it } from 'vitest';
import {
	buildSkaffurapportSnapshot,
	isoWeekdayFromDate,
	parseReportMonth,
	SKAFFURAPPORT_K_ANONYMITY_MIN
} from '$lib/domain/skaffurapport';

describe('skaffurapport domain', () => {
	it('parses report month boundaries', () => {
		const range = parseReportMonth('2026-06');
		expect(range?.start.toISOString()).toBe('2026-06-01T00:00:00.000Z');
		expect(range?.end.toISOString()).toBe('2026-07-01T00:00:00.000Z');
	});

	it('suppresses insights below k-anonymity threshold', () => {
		const events = Array.from({ length: SKAFFURAPPORT_K_ANONYMITY_MIN - 1 }, (_, index) => ({
			productName: 'Mjölk',
			createdAt: new Date('2026-06-03T12:00:00Z'),
			householdId: `household-${index}`
		}));

		const snapshot = buildSkaffurapportSnapshot('2026-06', events);
		expect(snapshot.meetsKAnonymity).toBe(false);
		expect(snapshot.topWastedCategory).toBeNull();
		expect(snapshot.weekdayChart).toEqual([]);
	});

	it('aggregates category and weekday insights when cohort is large enough', () => {
		const households = Array.from({ length: 12 }, (_, index) => `household-${index}`);
		const events = [
			...households.map((householdId) => ({
				productName: 'Gräddfil',
				createdAt: new Date('2026-06-02T18:00:00Z'),
				householdId
			})),
			...households.slice(0, 4).map((householdId) => ({
				productName: 'Bröd',
				createdAt: new Date('2026-06-03T10:00:00Z'),
				householdId
			}))
		];

		const snapshot = buildSkaffurapportSnapshot('2026-06', events);
		expect(snapshot.meetsKAnonymity).toBe(true);
		expect(snapshot.isBetaCohort).toBe(true);
		expect(snapshot.topWastedCategory).toBe('dairy');
		expect(snapshot.peakWasteWeekday).toBe(2);
		expect(snapshot.avgWastePerHousehold).toBeGreaterThan(1);
		expect(snapshot.categoryChart[0]?.categoryId).toBe('dairy');
		expect(snapshot.weekdayChart.find((bar) => bar.weekday === 2)?.count).toBe(12);
	});

	it('maps ISO weekday with Monday as 1', () => {
		expect(isoWeekdayFromDate(new Date('2026-06-01T12:00:00Z'))).toBe(1);
		expect(isoWeekdayFromDate(new Date('2026-06-07T12:00:00Z'))).toBe(7);
	});
});
