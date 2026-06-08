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

function isWeekday(date: Date): boolean {
	const day = date.getUTCDay();
	return day >= 1 && day <= 5;
}

/**
 * Collect upcoming Mon–Fri dates from referenceDate forward (never before today).
 * Spans up to ~2 calendar weeks so extra meals can spill into next week.
 */
export function getForwardMealDatePool(referenceDate = new Date(), maxWeekdays = 10): string[] {
	const todayIso = toIsoDate(referenceDate);
	const pool: string[] = [];
	const cursor = new Date(
		Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
	);
	const maxCalendarDays = maxWeekdays * 2 + 7;

	for (let offset = 0; offset < maxCalendarDays && pool.length < maxWeekdays; offset += 1) {
		const day = new Date(cursor);
		day.setUTCDate(cursor.getUTCDate() + offset);
		const iso = toIsoDate(day);

		if (isWeekday(day) && iso >= todayIso) {
			pool.push(iso);
		}
	}

	return pool;
}

/** First and last ISO dates in a planning pool (for hero labels). */
export function getPlanningWindowLabel(dates: string[]): { from: string; to: string } | null {
	if (dates.length === 0) {
		return null;
	}

	return { from: dates[0]!, to: dates[dates.length - 1]! };
}

/**
 * Assign dinner slots across upcoming weekdays (Mon–Fri), starting today or next open slot.
 * Never assigns dates before today; spills into the following week when needed.
 */
export function distributeMealDates(
	mealCount: number,
	referenceDate = new Date(),
	maxSlots = 5
): string[] {
	if (mealCount <= 0) {
		return [];
	}

	const pool = getForwardMealDatePool(referenceDate);
	const slots = Math.min(mealCount, maxSlots, pool.length);
	return pool.slice(0, slots);
}

/** Promote weekly ritual hero when expiring items or pantry needs confirmation. */
export function shouldPromoteWeeklyRitual(
	hasExpiringItems: boolean,
	syncNudgeCount = 0
): boolean {
	return hasExpiringItems || syncNudgeCount > 0;
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
