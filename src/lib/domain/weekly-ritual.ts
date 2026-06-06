import { startOfWeek, toIsoDate } from '$lib/domain/statistik';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Monday-based week dates (Mon–Sun) for the ISO week containing referenceDate. */
export function getWeekDateRange(referenceDate = new Date()): { from: string; to: string; dates: string[] } {
	const monday = startOfWeek(referenceDate);
	const dates: string[] = [];

	for (let offset = 0; offset < 7; offset += 1) {
		const day = new Date(monday);
		day.setUTCDate(day.getUTCDate() + offset);
		dates.push(toIsoDate(day));
	}

	return { from: dates[0]!, to: dates[6]!, dates };
}

/**
 * Assign dinner slots across upcoming weekdays (Mon–Fri), starting today or next open slot.
 * Skips past dates within the current week.
 */
export function distributeMealDates(
	mealCount: number,
	referenceDate = new Date(),
	maxSlots = 5
): string[] {
	if (mealCount <= 0) {
		return [];
	}

	const { dates } = getWeekDateRange(referenceDate);
	const todayIso = toIsoDate(referenceDate);
	const weekdayDates = dates.slice(0, 5);
	const eligible = weekdayDates.filter((date) => date >= todayIso);
	const pool = eligible.length > 0 ? eligible : weekdayDates;
	const slots = Math.min(mealCount, maxSlots, pool.length);
	const result: string[] = [];

	for (let index = 0; index < slots; index += 1) {
		result.push(pool[index]!);
	}

	return result;
}

/** Promote weekly ritual hero Mon–Wed or whenever expiring inventory exists. */
export function shouldPromoteWeeklyRitual(
	hasExpiringItems: boolean,
	referenceDate = new Date()
): boolean {
	if (hasExpiringItems) {
		return true;
	}

	const day = referenceDate.getDay();
	return day >= 1 && day <= 3;
}

export function isMondayRitualWindow(referenceDate = new Date()): boolean {
	const day = referenceDate.getDay();
	return day >= 1 && day <= 3;
}

export function daysUntilWeekEnd(referenceDate = new Date()): number {
	const { to } = getWeekDateRange(referenceDate);
	const end = new Date(`${to}T12:00:00Z`);
	const start = new Date(
		Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
	);
	return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY));
}
