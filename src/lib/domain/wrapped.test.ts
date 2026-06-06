import { describe, expect, it } from 'vitest';
import {
	buildMonthlySavingsReport,
	buildWrappedReport,
	buildWrappedSlides,
	isFirstMondayOfMonth,
	parseWrappedMonthParam,
	resolveTopConsumedProduct,
	shouldPromoteWrappedBanner,
	toMonthKey
} from './wrapped';

describe('wrapped month helpers', () => {
	it('parses valid month param', () => {
		const date = parseWrappedMonthParam('2026-06');
		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth()).toBe(5);
	});

	it('falls back for invalid month param', () => {
		const fallback = new Date(2026, 2, 15);
		const date = parseWrappedMonthParam('invalid', fallback);
		expect(date.getMonth()).toBe(2);
	});

	it('detects first Monday of month', () => {
		expect(isFirstMondayOfMonth(new Date(2026, 5, 1))).toBe(true);
		expect(isFirstMondayOfMonth(new Date(2026, 5, 8))).toBe(false);
		expect(isFirstMondayOfMonth(new Date(2026, 5, 2))).toBe(false);
	});

	it('promotes banner on first Monday unless dismissed for current month', () => {
		const monday = new Date(2026, 5, 1);
		expect(shouldPromoteWrappedBanner(monday, null)).toBe(true);
		expect(shouldPromoteWrappedBanner(monday, toMonthKey(monday))).toBe(false);
		expect(shouldPromoteWrappedBanner(new Date(2026, 5, 10), null)).toBe(false);
	});
});

describe('resolveTopConsumedProduct', () => {
	it('returns most frequent consumed product', () => {
		expect(
			resolveTopConsumedProduct([
				{ productName: 'Mjölk', eventType: 'consumed' },
				{ productName: 'Mjölk', eventType: 'consumed' },
				{ productName: 'Bröd', eventType: 'consumed' }
			])
		).toBe('Mjölk');
	});

	it('returns null when no consumed events', () => {
		expect(
			resolveTopConsumedProduct([{ productName: 'Mjölk', eventType: 'discarded' }])
		).toBeNull();
	});
});

describe('buildMonthlySavingsReport', () => {
	it('filters events to the requested period', () => {
		const since = new Date(2026, 5, 1);
		const until = new Date(2026, 5, 30, 23, 59, 59, 999);
		const report = buildMonthlySavingsReport(
			[
				{ productName: 'Mjölk', eventType: 'consumed', createdAt: new Date(2026, 5, 10) },
				{ productName: 'Bröd', eventType: 'consumed', createdAt: new Date(2026, 4, 20) }
			],
			since,
			until
		);

		expect(report.consumedCount).toBe(1);
		expect(report.savedSek).toBeGreaterThan(0);
	});
});

describe('buildWrappedSlides', () => {
	it('always includes intro and share', () => {
		const slides = buildWrappedSlides({
			isFirstMonth: true,
			monthlySavings: {
				hasData: false,
				consumedCount: 0,
				wastedCount: 0,
				savedSek: 0,
				savedKg: 0,
				wastedSek: 0,
				wastedKg: 0,
				netSek: 0
			},
			lifetimeSavedSek: 0,
			topProduct: null,
			zeroWasteWeeks: null,
			achievedMilestones: []
		});

		expect(slides.map((slide) => slide.id)).toEqual(['intro', 'share']);
	});

	it('includes savings, top product, streak and milestones when data exists', () => {
		const slides = buildWrappedSlides({
			isFirstMonth: false,
			monthlySavings: {
				hasData: true,
				consumedCount: 5,
				wastedCount: 0,
				savedSek: 120,
				savedKg: 2,
				wastedSek: 0,
				wastedKg: 0,
				netSek: 120
			},
			lifetimeSavedSek: 400,
			topProduct: 'Mjölk',
			zeroWasteWeeks: 3,
			achievedMilestones: ['firstConsumption', 'zeroWaste3']
		});

		expect(slides.map((slide) => slide.id)).toEqual([
			'intro',
			'savings',
			'topProduct',
			'streak',
			'milestones',
			'share'
		]);
	});
});

describe('buildWrappedReport', () => {
	it('assembles report payload with slides', () => {
		const report = buildWrappedReport({
			monthKey: '2026-06',
			isFirstMonth: false,
			monthlySavings: {
				hasData: true,
				consumedCount: 2,
				wastedCount: 0,
				savedSek: 70,
				savedKg: 1,
				wastedSek: 0,
				wastedKg: 0,
				netSek: 70
			},
			lifetimeSavedSek: 220,
			topProduct: 'Ost',
			zeroWasteWeeks: 2,
			achievedMilestones: ['firstConsumption']
		});

		expect(report.monthKey).toBe('2026-06');
		expect(report.slides.length).toBeGreaterThan(2);
		expect(report.consumedThisMonth).toBe(2);
	});
});
