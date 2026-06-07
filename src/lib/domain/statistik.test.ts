import { describe, it, expect } from 'vitest';
import {
	buildLastNWeekBars,
	capZeroWasteStreak,
	computeWeekOverWeek,
	computeZeroWasteStreak,
	maxWeeklyCount,
	startOfWeek,
	toIsoDate,
	weeksSinceHouseholdCreated
} from './statistik';

describe('statistik domain', () => {
	const referenceDate = new Date('2026-06-02T12:00:00Z');

	it('starts weeks on Monday', () => {
		const monday = startOfWeek(new Date('2026-06-04T12:00:00Z'));
		expect(monday.getUTCDay()).toBe(1);
		expect(toIsoDate(monday)).toBe('2026-06-01');
	});

	it('builds four week bars with zero-filled gaps', () => {
		const currentWeek = startOfWeek(referenceDate);
		const previousWeek = new Date(currentWeek);
		previousWeek.setUTCDate(previousWeek.getUTCDate() - 7);

		const bars = buildLastNWeekBars(
			[{ weekStart: toIsoDate(previousWeek), count: 3 }],
			4,
			referenceDate
		);

		expect(bars).toHaveLength(4);
		expect(bars[2].count).toBe(3);
		expect(bars[3].label).toBe('current');
	});

	it('computes week-over-week delta', () => {
		const wow = computeWeekOverWeek([
			{ weekStart: '2026-05-11', count: 2, label: 'w1' },
			{ weekStart: '2026-05-18', count: 4, label: 'w2' },
			{ weekStart: '2026-05-25', count: 1, label: 'w3' },
			{ weekStart: '2026-06-01', count: 3, label: 'current' }
		]);

		expect(wow).toEqual({ thisWeek: 3, lastWeek: 1, delta: 2, deltaPercent: 200 });
	});

	it('counts consecutive zero-waste weeks from the end', () => {
		const consumedByWeek = [
			{ weekStart: '2026-05-11', count: 2, label: 'w1' },
			{ weekStart: '2026-05-18', count: 1, label: 'w2' },
			{ weekStart: '2026-05-25', count: 3, label: 'w3' },
			{ weekStart: '2026-06-01', count: 1, label: 'current' }
		];

		expect(
			computeZeroWasteStreak(
				[
					{ weekStart: '2026-05-11', count: 1, label: 'w1' },
					{ weekStart: '2026-05-18', count: 0, label: 'w2' },
					{ weekStart: '2026-05-25', count: 0, label: 'w3' },
					{ weekStart: '2026-06-01', count: 0, label: 'current' }
				],
				consumedByWeek
			)
		).toBe(3);
	});

	it('ignores zero-filled weeks before first consumption', () => {
		const consumedByWeek = [
			{ weekStart: '2026-05-11', count: 0, label: 'w1' },
			{ weekStart: '2026-05-18', count: 0, label: 'w2' },
			{ weekStart: '2026-05-25', count: 0, label: 'w3' },
			{ weekStart: '2026-06-01', count: 4, label: 'current' }
		];
		const wasteByWeek = consumedByWeek.map((bar) => ({ ...bar, count: 0 }));

		expect(computeZeroWasteStreak(wasteByWeek, consumedByWeek)).toBe(1);
	});

	it('finds max bar height for chart scaling', () => {
		expect(
			maxWeeklyCount([
				{ weekStart: '2026-05-25', count: 2, label: 'w1' },
				{ weekStart: '2026-06-01', count: 5, label: 'current' }
			])
		).toBe(5);
	});

	it('counts inclusive weeks since household creation', () => {
		const referenceDate = new Date('2026-06-04T12:00:00Z');
		const createdThisWeek = new Date('2026-06-03T09:00:00Z');
		const createdThreeWeeksAgo = new Date('2026-05-14T09:00:00Z');

		expect(weeksSinceHouseholdCreated(createdThisWeek, referenceDate)).toBe(1);
		expect(weeksSinceHouseholdCreated(createdThreeWeeksAgo, referenceDate)).toBe(4);
	});

	it('caps streak to household age', () => {
		expect(capZeroWasteStreak(4, 1)).toBe(1);
		expect(capZeroWasteStreak(2, 4)).toBe(2);
		expect(capZeroWasteStreak(3, 0)).toBe(0);
	});
});
