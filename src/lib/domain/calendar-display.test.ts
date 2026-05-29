import { describe, expect, it } from 'vitest';
import {
	CALENDAR_VISIBLE_MEALS,
	formatCalendarDayLabel,
	mealSourceVariant,
	splitVisibleMeals
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
});
