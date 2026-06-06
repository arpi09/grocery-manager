import { describe, expect, it } from 'vitest';
import {
	distributeMealDates,
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

	it('distributes meals across remaining weekdays', () => {
		const wed = new Date('2026-06-03T10:00:00Z');
		const dates = distributeMealDates(3, wed);
		expect(dates).toEqual(['2026-06-03', '2026-06-04', '2026-06-05']);
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
