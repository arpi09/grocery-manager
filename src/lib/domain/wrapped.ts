import type { MilestoneId } from '$lib/domain/gamification';
import type { GamificationIllustrationVariant } from '$lib/domain/gamification.registry';
import { buildSavingsReport, type SavingsReport } from '$lib/domain/savings-estimate';

export type WrappedSlideId = 'intro' | 'savings' | 'topProduct' | 'streak' | 'milestones' | 'share';

export interface WrappedSlide {
	id: WrappedSlideId;
	illustration: GamificationIllustrationVariant;
}

export interface WrappedConsumptionEvent {
	productName: string;
	eventType: 'consumed' | 'discarded' | 'expired';
}

export interface BuildWrappedSlidesInput {
	isFirstMonth: boolean;
	monthlySavings: SavingsReport;
	lifetimeSavedSek: number;
	topProduct: string | null;
	zeroWasteWeeks: number | null;
	achievedMilestones: MilestoneId[];
}

export interface WrappedReportData {
	monthKey: string;
	isFirstMonth: boolean;
	monthlySavings: SavingsReport;
	lifetimeSavedSek: number;
	topProduct: string | null;
	consumedThisMonth: number;
	zeroWasteWeeks: number | null;
	achievedMilestones: MilestoneId[];
	slides: WrappedSlide[];
}

export function toMonthKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfNextMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function parseWrappedMonthParam(month: string | null, fallback = new Date()): Date {
	if (!month || !/^\d{4}-\d{2}$/.test(month)) {
		return startOfMonth(fallback);
	}

	const [yearRaw, monthRaw] = month.split('-');
	const year = Number(yearRaw);
	const monthIndex = Number(monthRaw) - 1;
	if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
		return startOfMonth(fallback);
	}

	return new Date(year, monthIndex, 1);
}

export function isFirstMondayOfMonth(date: Date): boolean {
	return date.getDay() === 1 && date.getDate() <= 7;
}

export function shouldPromoteWrappedBanner(
	referenceDate: Date,
	dismissedMonthKey: string | null
): boolean {
	if (!isFirstMondayOfMonth(referenceDate)) {
		return false;
	}

	return dismissedMonthKey !== toMonthKey(referenceDate);
}

export function filterEventsInPeriod(
	events: WrappedConsumptionEvent[],
	since: Date,
	until: Date
): WrappedConsumptionEvent[] {
	const sinceMs = since.getTime();
	const untilMs = until.getTime();
	return events.filter((event) => {
		const createdAt = (event as WrappedConsumptionEvent & { createdAt?: Date }).createdAt;
		if (!createdAt) {
			return true;
		}
		const ms = createdAt.getTime();
		return ms >= sinceMs && ms <= untilMs;
	});
}

export function buildMonthlySavingsReport(
	events: Array<WrappedConsumptionEvent & { createdAt?: Date }>,
	since: Date,
	until: Date
): SavingsReport {
	return buildSavingsReport(filterEventsInPeriod(events, since, until));
}

export function resolveTopConsumedProduct(events: WrappedConsumptionEvent[]): string | null {
	const counts = new Map<string, number>();

	for (const event of events) {
		if (event.eventType !== 'consumed') {
			continue;
		}

		const name = event.productName.trim();
		if (!name) {
			continue;
		}

		counts.set(name, (counts.get(name) ?? 0) + 1);
	}

	let top: string | null = null;
	let max = 0;

	for (const [name, count] of counts) {
		if (count > max) {
			max = count;
			top = name;
		}
	}

	return top;
}

export function buildWrappedSlides(input: BuildWrappedSlidesInput): WrappedSlide[] {
	const slides: WrappedSlide[] = [{ id: 'intro', illustration: 'ritual' }];

	const savingsHasStory =
		input.monthlySavings.hasData ||
		input.monthlySavings.savedSek > 0 ||
		input.lifetimeSavedSek > 0;

	if (savingsHasStory) {
		slides.push({ id: 'savings', illustration: 'savings' });
	}

	if (input.topProduct) {
		slides.push({ id: 'topProduct', illustration: 'milestone' });
	}

	if ((input.zeroWasteWeeks ?? 0) >= 1) {
		slides.push({ id: 'streak', illustration: 'streak' });
	}

	if (input.achievedMilestones.length > 0) {
		slides.push({ id: 'milestones', illustration: 'milestone' });
	}

	slides.push({ id: 'share', illustration: 'savings' });
	return slides;
}

export function buildWrappedReport(input: {
	monthKey: string;
	isFirstMonth: boolean;
	monthlySavings: SavingsReport;
	lifetimeSavedSek: number;
	topProduct: string | null;
	zeroWasteWeeks: number | null;
	achievedMilestones: MilestoneId[];
}): WrappedReportData {
	const slides = buildWrappedSlides({
		isFirstMonth: input.isFirstMonth,
		monthlySavings: input.monthlySavings,
		lifetimeSavedSek: input.lifetimeSavedSek,
		topProduct: input.topProduct,
		zeroWasteWeeks: input.zeroWasteWeeks,
		achievedMilestones: input.achievedMilestones
	});

	return {
		monthKey: input.monthKey,
		isFirstMonth: input.isFirstMonth,
		monthlySavings: input.monthlySavings,
		lifetimeSavedSek: input.lifetimeSavedSek,
		topProduct: input.topProduct,
		consumedThisMonth: input.monthlySavings.consumedCount,
		zeroWasteWeeks: input.zeroWasteWeeks,
		achievedMilestones: input.achievedMilestones,
		slides
	};
}

