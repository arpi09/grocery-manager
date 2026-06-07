import { describe, expect, it } from 'vitest';
import {
	distributeMealDates,
	getForwardMealDatePool,
	getPlanningWindowLabel,
	getWeekDateRange,
	shouldPromoteWeeklyRitual
} from '$lib/domain/weekly-ritual';

describe('weekly-ritual', () => {
	it('returns Mon–Sun for a Wednesday', () => {
		const wed = new Date('2026-06-03T10:00:00Z');
		const range = getWeekDateRange(wed);
		expect(range.dates).toHaveLength(7);
		expect(range.from).toBe('2026-06-01');
		expect(range.to).toBe('2026-06-07');
	});

	it('distributes meals across remaining weekdays on Wednesday', () => {
		const wed = new Date('2026-06-03T10:00:00Z');
		const dates = distributeMealDates(3, wed);
		expect(dates).toEqual(['2026-06-03', '2026-06-04', '2026-06-05']);
	});

	it('starts next Monday on Sunday with 3 meals', () => {
		const sunday = new Date('2026-06-07T10:00:00Z');
		const dates = distributeMealDates(3, sunday);
		expect(dates).toEqual(['2026-06-08', '2026-06-09', '2026-06-10']);
	});

	it('spills into next week when more meals than remaining weekdays', () => {
		const wed = new Date('2026-06-03T10:00:00Z');
		const dates = distributeMealDates(5, wed);
		expect(dates).toEqual([
			'2026-06-03',
			'2026-06-04',
			'2026-06-05',
			'2026-06-08',
			'2026-06-09'
		]);
	});

	it('starts next Monday on Saturday', () => {
		const saturday = new Date('2026-06-06T10:00:00Z');
		const pool = getForwardMealDatePool(saturday, 5);
		expect(pool[0]).toBe('2026-06-08');
		expect(distributeMealDates(3, saturday)).toEqual(['2026-06-08', '2026-06-09', '2026-06-10']);
	});

	it('never includes past weekdays when pool would otherwise be empty', () => {
		const sunday = new Date('2026-06-07T10:00:00Z');
		const pool = getForwardMealDatePool(sunday);
		expect(pool.every((date) => date >= '2026-06-07')).toBe(true);
		expect(pool[0]).toBe('2026-06-08');
	});

	it('returns planning window from first and last pool date', () => {
		expect(getPlanningWindowLabel(['2026-06-08', '2026-06-09', '2026-06-12'])).toEqual({
			from: '2026-06-08',
			to: '2026-06-12'
		});
		expect(getPlanningWindowLabel([])).toBeNull();
	});

	it('promotes ritual when expiring items exist', () => {
		expect(shouldPromoteWeeklyRitual(true, new Date('2026-06-06T10:00:00Z'))).toBe(true);
	});

	it('promotes ritual Mon–Wed without expiring items', () => {
		const mon = new Date('2026-06-01T10:00:00Z');
		const fri = new Date('2026-06-05T10:00:00Z');
		expect(shouldPromoteWeeklyRitual(false, mon)).toBe(true);
		expect(shouldPromoteWeeklyRitual(false, fri)).toBe(false);
	});
});
