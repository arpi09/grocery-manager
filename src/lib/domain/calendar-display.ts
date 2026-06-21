export const CALENDAR_VISIBLE_MEALS = {
	mobile: 2,
	desktop: 3,
	week: 8
} as const;

export type MealSourceVariant = 'idea' | 'manual';

export function mealSourceVariant(ideaId: string | null): MealSourceVariant {
	return ideaId ? 'idea' : 'manual';
}

export function splitVisibleMeals<T>(meals: T[], limit: number): {
	visible: T[];
	hiddenCount: number;
} {
	const visible = meals.slice(0, limit);
	return {
		visible,
		hiddenCount: Math.max(0, meals.length - limit)
	};
}

export function parseIsoDate(iso: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
		return null;
	}

	const [yearRaw, monthRaw, dayRaw] = iso.split('-');
	const year = Number(yearRaw);
	const monthIndex = Number(monthRaw) - 1;
	const day = Number(dayRaw);
	if (
		!Number.isInteger(year) ||
		!Number.isInteger(monthIndex) ||
		!Number.isInteger(day) ||
		monthIndex < 0 ||
		monthIndex > 11 ||
		day < 1 ||
		day > 31
	) {
		return null;
	}

	const date = new Date(year, monthIndex, day);
	if (
		date.getFullYear() !== year ||
		date.getMonth() !== monthIndex ||
		date.getDate() !== day
	) {
		return null;
	}

	return date;
}

export function toIsoDate(date: Date): string {
	const y = date.getFullYear();
	const m = `${date.getMonth() + 1}`.padStart(2, '0');
	const d = `${date.getDate()}`.padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** Monday of the ISO week containing `iso` (local calendar). */
export function startOfWeekMonday(iso: string): string {
	const date = parseIsoDate(iso) ?? new Date();
	const mondayBasedOffset = (date.getDay() + 6) % 7;
	date.setDate(date.getDate() - mondayBasedOffset);
	return toIsoDate(date);
}

/** Shift by whole weeks; result is always normalized to Monday. */
export function shiftWeek(iso: string, deltaWeeks: number): string {
	const date = parseIsoDate(iso) ?? new Date();
	date.setDate(date.getDate() + deltaWeeks * 7);
	return startOfWeekMonday(toIsoDate(date));
}

export function parseWeekParam(week: string | null, fallbackIso: string): string {
	if (!week) {
		return startOfWeekMonday(fallbackIso);
	}

	return startOfWeekMonday(parseIsoDate(week) ? week : fallbackIso);
}

/** e.g. "3–9 juni 2026" (sv-SE) */
export function formatWeekRangeLabel(startIso: string, locale = 'sv-SE'): string {
	const start = parseIsoDate(startIso);
	if (!start) {
		return startIso;
	}

	const end = new Date(start);
	end.setDate(end.getDate() + 6);

	const startDay = start.getDate();
	const endDay = end.getDate();
	const endYear = end.getFullYear();

	if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
		const month = start.toLocaleDateString(locale, { month: 'long' });
		return `${startDay}–${endDay} ${month} ${endYear}`;
	}

	const startLabel = start.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
	const endLabel = end.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
	return `${startLabel}–${endLabel} ${endYear}`;
}

export function formatCalendarDayLabel(isoDate: string, locale = 'sv-SE'): string {
	const date = new Date(`${isoDate}T12:00:00`);
	return date.toLocaleDateString(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
}

export const CALENDAR_WEEKDAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'] as const;

export type CalendarViewMode = 'week' | 'month';

interface CalendarDayLike {
	date: string;
	isCurrentMonth: boolean;
}

/** Return the week row containing `dateIso`, or the first in-month week as fallback. */
export function findWeekForDate<T extends CalendarDayLike>(
	weeks: T[][],
	dateIso: string
): T[] {
	for (const week of weeks) {
		if (week.some((day) => day.date === dateIso)) {
			return week;
		}
	}

	for (const week of weeks) {
		if (week.some((day) => day.isCurrentMonth)) {
			return week;
		}
	}

	return weeks[0] ?? [];
}
