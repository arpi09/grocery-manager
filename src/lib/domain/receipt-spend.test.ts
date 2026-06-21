import { describe, it, expect } from 'vitest';
import {
	buildReceiptSpendReport,
	resolveLineAmountSek,
	roundSekForDisplay,
	type ReceiptSpendLine
} from './receipt-spend';

const referenceDate = new Date('2026-06-15T12:00:00Z');

function line(
	overrides: Partial<ReceiptSpendLine> & Pick<ReceiptSpendLine, 'purchasedAt'>
): ReceiptSpendLine {
	return {
		purchasedAt: overrides.purchasedAt,
		lineTotalSek: overrides.lineTotalSek ?? null,
		unitPriceSek: overrides.unitPriceSek ?? null,
		quantity: overrides.quantity ?? null,
		storeLabel: overrides.storeLabel ?? null,
		importBatchId: overrides.importBatchId ?? 'batch-1'
	};
}

describe('resolveLineAmountSek', () => {
	it('prefers lineTotal when positive', () => {
		expect(
			resolveLineAmountSek({ lineTotalSek: 42.5, unitPriceSek: 10, quantity: 2 })
		).toBe(42.5);
	});

	it('uses unitPrice × quantity when lineTotal missing', () => {
		expect(resolveLineAmountSek({ lineTotalSek: null, unitPriceSek: 12.5, quantity: 2 })).toBe(25);
	});

	it('falls back to unitPrice alone', () => {
		expect(resolveLineAmountSek({ lineTotalSek: null, unitPriceSek: 19.9, quantity: null })).toBe(
			19.9
		);
	});

	it('returns null when no price data', () => {
		expect(
			resolveLineAmountSek({ lineTotalSek: null, unitPriceSek: null, quantity: 2 })
		).toBeNull();
	});

	it('ignores zero lineTotal and uses unitPrice', () => {
		expect(resolveLineAmountSek({ lineTotalSek: 0, unitPriceSek: 5, quantity: 3 })).toBe(15);
	});
});

describe('buildReceiptSpendReport', () => {
	it('returns empty report without lines', () => {
		const report = buildReceiptSpendReport([], referenceDate);
		expect(report.hasData).toBe(false);
		expect(report.thisMonthSek).toBe(0);
		expect(report.topStores).toEqual([]);
	});

	it('aggregates monthly spend and delta', () => {
		const lines = [
			line({
				purchasedAt: new Date('2026-06-10T10:00:00Z'),
				lineTotalSek: 100,
				importBatchId: 'a'
			}),
			line({
				purchasedAt: new Date('2026-06-12T10:00:00Z'),
				unitPriceSek: 50,
				quantity: 2,
				importBatchId: 'b'
			}),
			line({
				purchasedAt: new Date('2026-05-20T10:00:00Z'),
				lineTotalSek: 80,
				importBatchId: 'c'
			})
		];

		const report = buildReceiptSpendReport(lines, referenceDate);
		expect(report.hasData).toBe(true);
		expect(report.thisMonthSek).toBe(200);
		expect(report.lastMonthSek).toBe(80);
		expect(report.monthDeltaSek).toBe(120);
		expect(report.tripCountThisMonth).toBe(2);
	});

	it('builds weekly spend bars for four weeks', () => {
		const lines = [
			line({
				purchasedAt: new Date('2026-06-10T10:00:00Z'),
				lineTotalSek: 40
			}),
			line({
				purchasedAt: new Date('2026-06-03T10:00:00Z'),
				lineTotalSek: 30
			})
		];

		const report = buildReceiptSpendReport(lines, referenceDate);
		expect(report.weeklySpend).toHaveLength(4);
		const totalWeekSek = report.weeklySpend.reduce((sum, bar) => sum + bar.count, 0);
		expect(totalWeekSek).toBe(70);
	});

	it('ranks top stores', () => {
		const lines = [
			line({
				purchasedAt: new Date('2026-06-10T10:00:00Z'),
				lineTotalSek: 90,
				storeLabel: 'ICA'
			}),
			line({
				purchasedAt: new Date('2026-06-11T10:00:00Z'),
				lineTotalSek: 120,
				storeLabel: 'Willys'
			}),
			line({
				purchasedAt: new Date('2026-06-12T10:00:00Z'),
				lineTotalSek: 50,
				storeLabel: 'ICA'
			})
		];

		const report = buildReceiptSpendReport(lines, referenceDate);
		expect(report.topStores).toEqual([
			{ storeLabel: 'ICA', sek: 140 },
			{ storeLabel: 'Willys', sek: 120 }
		]);
	});

	it('computes priced line ratio', () => {
		const lines = [
			line({ purchasedAt: new Date('2026-06-10T10:00:00Z'), lineTotalSek: 10 }),
			line({ purchasedAt: new Date('2026-06-11T10:00:00Z'), lineTotalSek: null, unitPriceSek: null })
		];

		const report = buildReceiptSpendReport(lines, referenceDate);
		expect(report.pricedLineRatio).toBe(0.5);
	});

	it('treats imported receipt lines as data even when purchasedAt is outside lookback', () => {
		const lines = [
			line({
				purchasedAt: new Date('2025-12-01T10:00:00Z'),
				lineTotalSek: 250,
				importBatchId: 'old-receipt'
			})
		];

		const report = buildReceiptSpendReport(lines, referenceDate);
		expect(report.hasData).toBe(true);
		expect(report.thisMonthSek).toBe(0);
		expect(report.tripCountThisMonth).toBe(0);
	});
});

describe('roundSekForDisplay', () => {
	it('rounds to whole kronor', () => {
		expect(roundSekForDisplay(12.4)).toBe(12);
		expect(roundSekForDisplay(12.6)).toBe(13);
	});
});
