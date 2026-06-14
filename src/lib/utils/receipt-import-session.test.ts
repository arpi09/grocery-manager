import { describe, expect, it, vi } from 'vitest';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import {
	aggregateReceiptImportSummary,
	clearReceiptImportToastPending,
	isReceiptImportToastPending,
	markReceiptImportCompleted,
	receiptImportToastMessage,
	RECEIPT_IMPORT_JUST_COMPLETED_KEY,
	RECEIPT_IMPORT_TOAST_PENDING_KEY,
	type ReceiptImportLineContext
} from './receipt-import-session';

function lineContext(
	overrides: Partial<ReceiptImportLineContext> & { index: number }
): ReceiptImportLineContext {
	const line: ReceiptLine = overrides.line ?? {
		name: `Item ${overrides.index}`,
		location: 'cupboard'
	};
	return {
		line,
		index: overrides.index,
		selected: overrides.selected ?? true,
		lineExpiresOn: overrides.lineExpiresOn ?? '',
		lineLocation: overrides.lineLocation ?? line.location,
		locationOverride: overrides.locationOverride ?? false,
		shelfLifePrediction: overrides.shelfLifePrediction ?? null,
		locationPrediction: overrides.locationPrediction ?? null,
		shelfLifeEstimatesInReceipt: overrides.shelfLifeEstimatesInReceipt ?? true
	};
}

describe('aggregateReceiptImportSummary', () => {
	it('counts estimated dates when prediction is kept', () => {
		const summary = aggregateReceiptImportSummary([
			lineContext({
				index: 0,
				lineExpiresOn: '2026-07-01',
				shelfLifePrediction: {
					expiresOn: '2026-07-01',
					typicalDays: 7,
					modelVersion: 'v1',
					expiresOnSource: 'heuristic'
				}
			})
		]);

		expect(summary.estimatedDates).toBe(1);
		expect(summary.locationCorrections).toBe(0);
		expect(summary.rulesImproved).toBe(1);
	});

	it('counts location corrections when user overrides prediction', () => {
		const summary = aggregateReceiptImportSummary([
			lineContext({
				index: 0,
				lineLocation: 'fridge',
				locationOverride: true,
				locationPrediction: {
					location: 'cupboard',
					source: 'heuristic',
					modelVersion: 'v1'
				}
			})
		]);

		expect(summary.estimatedDates).toBe(0);
		expect(summary.locationCorrections).toBe(1);
		expect(summary.rulesImproved).toBe(1);
	});

	it('skips deselected lines', () => {
		const summary = aggregateReceiptImportSummary([
			lineContext({
				index: 0,
				selected: false,
				shelfLifePrediction: {
					expiresOn: '2026-07-01',
					typicalDays: 7,
					modelVersion: 'v1',
					expiresOnSource: 'heuristic'
				}
			})
		]);

		expect(summary).toEqual({
			estimatedDates: 0,
			locationCorrections: 0,
			rulesImproved: 0
		});
	});
});

describe('receiptImportToastMessage', () => {
	it('includes summary details when present', () => {
		const message = receiptImportToastMessage('sv', 3, {
			estimatedDates: 2,
			locationCorrections: 1,
			rulesImproved: 2
		});

		expect(message).toContain('3');
		expect(message).toContain('2');
		expect(message).toContain('1');
	});

	it('returns headline only when summary is empty', () => {
		const message = receiptImportToastMessage('sv', 1, {
			estimatedDates: 0,
			locationCorrections: 0,
			rulesImproved: 0
		});

		expect(message).not.toContain('·');
	});
});

describe('markReceiptImportCompleted', () => {
	it('stores summary and toast pending flag in sessionStorage', () => {
		const storage = new Map<string, string>();
		vi.stubGlobal('sessionStorage', {
			setItem: (key: string, value: string) => storage.set(key, value),
			getItem: (key: string) => storage.get(key) ?? null,
			removeItem: (key: string) => {
				storage.delete(key);
			}
		});

		markReceiptImportCompleted(2, {
			estimatedDates: 1,
			locationCorrections: 1,
			rulesImproved: 2
		});

		expect(storage.get(RECEIPT_IMPORT_JUST_COMPLETED_KEY)).toContain('"itemsAdded":2');
		expect(storage.get(RECEIPT_IMPORT_TOAST_PENDING_KEY)).toBe('1');
		expect(isReceiptImportToastPending()).toBe(true);

		clearReceiptImportToastPending();
		expect(isReceiptImportToastPending()).toBe(false);
	});
});
