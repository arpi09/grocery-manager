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
