import { describe, it, expect } from 'vitest';
import {
	buildHouseholdInsights,
	computeShoppingRhythm,
	computeTopProduct,
	pickHighlightInsights,
	type PurchaseInsightLine
} from './household-insights';
import { EMPTY_RECEIPT_SPEND_REPORT } from './receipt-spend';

const emptyImpact = {
	hasConsumptionData: false,
	consumedThisWeek: null,
	consumedWeekOverWeek: null,
	consumedTrend: [],
	wasteTrend: [],
	zeroWasteWeeks: null
};

const emptyAnalytics = {
	totalItems: 10,
	totalQuantity: '10',
	distinctProducts: 5,
	expiringSoonCount: 0,
	withoutExpiryCount: 0,
	lowStockCount: 0,
	addedLast7Days: 2,
	byLocation: [],
	byLocationBars: []
};

function line(
	overrides: Partial<PurchaseInsightLine> & Pick<PurchaseInsightLine, 'purchasedAt'>
): PurchaseInsightLine {
	return {
		productName: overrides.productName ?? 'Mjölk',
		normalizedKey: overrides.normalizedKey ?? 'mjolk',
		purchasedAt: overrides.purchasedAt,
		importBatchId: overrides.importBatchId ?? 'batch-1'
	};
}

describe('household-insights', () => {
	it('finds most bought product when repeated', () => {
		expect(
			computeTopProduct([
				{ productName: 'Mjölk', normalizedKey: 'mjolk' },
				{ productName: 'Mjölk', normalizedKey: 'mjolk' },
				{ productName: 'Bröd', normalizedKey: 'brod' }
			])
		).toEqual({
			kind: 'top_product',
			productName: 'Mjölk',
			purchaseCount: 2
		});
	});

	it('ignores single-purchase products for top product', () => {
		expect(
			computeTopProduct([{ productName: 'Mjölk', normalizedKey: 'mjolk' }])
		).toBeNull();
	});

	it('computes average days between shopping trips', () => {
		expect(
			computeShoppingRhythm([
				line({ purchasedAt: new Date('2026-06-01T10:00:00Z'), importBatchId: 'a' }),
				line({ purchasedAt: new Date('2026-06-08T10:00:00Z'), importBatchId: 'b' }),
				line({ purchasedAt: new Date('2026-06-22T10:00:00Z'), importBatchId: 'c' })
			])
		).toEqual({
			kind: 'shopping_rhythm',
			avgDays: 11,
			tripCount: 3
		});
	});

	it('builds a curated highlight set from real inputs', () => {
		const insights = buildHouseholdInsights({
			purchaseLines: [
				line({
					productName: 'Mjölk',
					normalizedKey: 'mjolk',
					purchasedAt: new Date('2026-06-01T10:00:00Z'),
					importBatchId: 'a'
				}),
				line({
					productName: 'Mjölk',
					normalizedKey: 'mjolk',
					purchasedAt: new Date('2026-06-08T10:00:00Z'),
					importBatchId: 'b'
				}),
				line({
					productName: 'Bröd',
					normalizedKey: 'brod',
					purchasedAt: new Date('2026-06-08T10:00:00Z'),
					importBatchId: 'b'
				})
			],
			spend: {
				...EMPTY_RECEIPT_SPEND_REPORT,
				hasData: true,
				thisMonthSek: 450,
				topStores: [{ storeLabel: 'ICA', sek: 300 }]
			},
			impact: {
				...emptyImpact,
				hasConsumptionData: true,
				zeroWasteWeeks: 3
			},
			savings: {
				hasData: true,
				consumedCount: 5,
				wastedCount: 0,
				savedSek: 120,
				savedKg: 1.2,
				wastedSek: 0,
				wastedKg: 0,
				netSek: 120
			},
			analytics: emptyAnalytics,
			plannedMealsThisWeek: 2
		});

		expect(insights.map((insight) => insight.kind)).toEqual([
			'top_product',
			'shopping_rhythm',
			'favorite_store',
			'zero_waste_streak',
			'saved_value'
		]);
	});

	it('caps highlights at five insights', () => {
		const many = pickHighlightInsights([
			{ kind: 'top_product', productName: 'Mjölk', purchaseCount: 4 },
			{ kind: 'shopping_rhythm', avgDays: 7, tripCount: 4 },
			{ kind: 'favorite_store', storeLabel: 'ICA', sharePercent: 60 },
			{ kind: 'expiring_soon', count: 3 },
			{ kind: 'zero_waste_streak', weeks: 2 },
			{ kind: 'saved_value', savedSek: 80, consumedCount: 3 },
			{ kind: 'planned_meals', count: 2 },
			{ kind: 'pantry_variety', distinctProducts: 12 }
		]);

		expect(many).toHaveLength(5);
		expect(many.some((insight) => insight.kind === 'expiring_soon')).toBe(true);
	});
});
