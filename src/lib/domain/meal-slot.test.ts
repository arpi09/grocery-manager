import { describe, expect, it } from 'vitest';
import { getCurrentMealSlot, getTimeOfDay } from './meal-slot';

function at(hour: number, minute = 0): Date {
	return new Date(2026, 5, 2, hour, minute);
}

describe('getCurrentMealSlot', () => {
	it('maps hours to Swedish meal periods', () => {
		expect(getCurrentMealSlot(at(7))).toBe('breakfast');
		expect(getCurrentMealSlot(at(12))).toBe('lunch');
		expect(getCurrentMealSlot(at(15))).toBe('lunch');
		expect(getCurrentMealSlot(at(18))).toBe('dinner');
		expect(getCurrentMealSlot(at(22))).toBe('evening');
	});
});

describe('getTimeOfDay', () => {
	it('returns greeting tone buckets', () => {
		expect(getTimeOfDay(at(8))).toBe('morning');
		expect(getTimeOfDay(at(14))).toBe('day');
		expect(getTimeOfDay(at(19))).toBe('evening');
		expect(getTimeOfDay(at(23))).toBe('night');
	});
});
