import { classifyProductCategory, type ProductCategoryId } from '$lib/domain/savings-estimate';

export const SKAFFURAPPORT_K_ANONYMITY_MIN = 10;
export const SKAFFURAPPORT_BETA_COHORT_MIN = 50;

export interface SkaffurapportWasteEvent {
	productName: string;
	createdAt: Date;
	householdId: string;
}

export interface SkaffurapportWeekdayBar {
	weekday: number;
	count: number;
}

export interface SkaffurapportCategoryBar {
	categoryId: ProductCategoryId;
	count: number;
}

export interface SkaffurapportSnapshot {
	month: string;
	generatedAt: string;
	householdCount: number;
	eventCount: number;
	meetsKAnonymity: boolean;
	isBetaCohort: boolean;
	topWastedCategory: ProductCategoryId | null;
	peakWasteWeekday: number | null;
	avgWastePerHousehold: number | null;
	weekdayChart: SkaffurapportWeekdayBar[];
	categoryChart: SkaffurapportCategoryBar[];
}

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function isValidReportMonth(value: string): boolean {
	return MONTH_PATTERN.test(value);
}

export function parseReportMonth(value: string): { start: Date; end: Date } | null {
	if (!isValidReportMonth(value)) {
		return null;
	}

	const [yearRaw, monthRaw] = value.split('-');
	const year = Number(yearRaw);
	const month = Number(monthRaw);
	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		return null;
	}

	const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
	const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
	return { start, end };
}

/** ISO weekday: Monday = 1 … Sunday = 7 */
export function isoWeekdayFromDate(date: Date): number {
	const day = date.getUTCDay();
	return day === 0 ? 7 : day;
}

function countBy<T extends string>(values: T[]): Map<T, number> {
	const counts = new Map<T, number>();
	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	return counts;
}

function topEntry<T extends string>(counts: Map<T, number>): T | null {
	let top: T | null = null;
	let topCount = 0;
	for (const [key, count] of counts) {
		if (count > topCount) {
			top = key;
			topCount = count;
		}
	}
	return top;
}

export function buildSkaffurapportSnapshot(
	month: string,
	events: SkaffurapportWasteEvent[],
	generatedAt: Date = new Date()
): SkaffurapportSnapshot {
	const householdIds = new Set(events.map((event) => event.householdId));
	const householdCount = householdIds.size;
	const eventCount = events.length;
	const meetsKAnonymity = householdCount >= SKAFFURAPPORT_K_ANONYMITY_MIN;
	const isBetaCohort = householdCount < SKAFFURAPPORT_BETA_COHORT_MIN;

	if (!meetsKAnonymity) {
		return {
			month,
			generatedAt: generatedAt.toISOString(),
			householdCount,
			eventCount,
			meetsKAnonymity,
			isBetaCohort,
			topWastedCategory: null,
			peakWasteWeekday: null,
			avgWastePerHousehold: null,
			weekdayChart: [],
			categoryChart: []
		};
	}

	const categoryCounts = countBy(events.map((event) => classifyProductCategory(event.productName)));
	const weekdayCounts = countBy(events.map((event) => String(isoWeekdayFromDate(event.createdAt))));

	const weekdayChart: SkaffurapportWeekdayBar[] = Array.from({ length: 7 }, (_, index) => {
		const weekday = index + 1;
		return {
			weekday,
			count: weekdayCounts.get(String(weekday)) ?? 0
		};
	});

	const categoryChart: SkaffurapportCategoryBar[] = [...categoryCounts.entries()]
		.map(([categoryId, count]) => ({
			categoryId: categoryId as ProductCategoryId,
			count
		}))
		.sort((a, b) => b.count - a.count);

	return {
		month,
		generatedAt: generatedAt.toISOString(),
		householdCount,
		eventCount,
		meetsKAnonymity,
		isBetaCohort,
		topWastedCategory: topEntry(categoryCounts),
		peakWasteWeekday: topEntry(weekdayCounts) ? Number(topEntry(weekdayCounts)) : null,
		avgWastePerHousehold:
			householdCount > 0 ? Math.round((eventCount / householdCount) * 10) / 10 : null,
		weekdayChart,
		categoryChart
	};
}

export function skaffurapportSettingsKey(month: string): string {
	return `skaffurapport:${month}`;
}
