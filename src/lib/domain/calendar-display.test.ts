import { describe, expect, it } from 'vitest';
import {
	CALENDAR_VISIBLE_MEALS,
	formatCalendarDayLabel,
	findWeekForDate,
	formatWeekRangeLabel,
	mealSourceVariant,
	parseWeekParam,
	shiftWeek,
	splitVisibleMeals,
	startOfWeekMonday
} from './calendar-display';

describe('calendar-display', () => {
	it('splits visible meals and counts overflow', () => {
		const meals = ['a', 'b', 'c', 'd', 'e'];
		expect(splitVisibleMeals(meals, 2)).toEqual({
			visible: ['a', 'b'],
			hiddenCount: 3
		});
		expect(splitVisibleMeals(meals, CALENDAR_VISIBLE_MEALS.desktop)).toEqual({
			visible: ['a', 'b', 'c'],
			hiddenCount: 2
		});
		expect(splitVisibleMeals([], 3)).toEqual({ visible: [], hiddenCount: 0 });
	});

	it('classifies meal source by idea id', () => {
		expect(mealSourceVariant(null)).toBe('manual');
		expect(mealSourceVariant('idea-1')).toBe('idea');
	});

	it('formats day labels in Swedish', () => {
		expect(formatCalendarDayLabel('2026-05-29')).toMatch(/29/);
		expect(formatCalendarDayLabel('2026-05-29')).toMatch(/maj/i);
	});

	it('normalizes to Monday for startOfWeekMonday', () => {
		expect(startOfWeekMonday('2026-06-04')).toBe('2026-06-01');
		expect(startOfWeekMonday('2026-06-01')).toBe('2026-06-01');
		expect(startOfWeekMonday('2026-06-07')).toBe('2026-06-01');
	});

	it('shifts by whole weeks', () => {
		expect(shiftWeek('2026-06-01', 1)).toBe('2026-06-08');
		expect(shiftWeek('2026-06-01', -1)).toBe('2026-05-25');
	});

	it('parses week param with fallback', () => {
		expect(parseWeekParam('2026-06-04', '2026-01-01')).toBe('2026-06-01');
		expect(parseWeekParam(null, '2026-06-04')).toBe('2026-06-01');
		expect(parseWeekParam('invalid', '2026-06-04')).toBe('2026-06-01');
	});

	it('formats week range labels in Swedish', () => {
		expect(formatWeekRangeLabel('2026-06-01')).toMatch(/1.*7.*juni.*2026/i);
		expect(formatWeekRangeLabel('2026-05-26')).toMatch(/26.*1.*juni.*2026/i);
	});

	it('finds the week containing a date', () => {
		const weeks = [
			[
				{ date: '2026-06-01', isCurrentMonth: true },
				{ date: '2026-06-02', isCurrentMonth: true }
			],
			[
				{ date: '2026-06-08', isCurrentMonth: true },
				{ date: '2026-06-09', isCurrentMonth: true }
			]
		];

		expect(findWeekForDate(weeks, '2026-06-09').map((day) => day.date)).toEqual([
			'2026-06-08',
			'2026-06-09'
		]);
		expect(findWeekForDate(weeks, '2026-06-15').map((day) => day.date)).toEqual([
			'2026-06-01',
			'2026-06-02'
		]);
	});
});
