import { describe, expect, it, vi } from 'vitest';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import {
	aggregateReceiptImportSummary,
	aggregateReceiptLocationCounts,
	clearReceiptImportSuccessPending,
	dominantStorageLocation,
	isReceiptImportToastPending,
	markReceiptImportCompleted,
	readReceiptImportCompleted,
	receiptImportToastMessage,
	RECEIPT_IMPORT_JUST_COMPLETED_KEY,
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

describe('aggregateReceiptLocationCounts', () => {
	it('counts selected lines per storage location', () => {
		expect(
			aggregateReceiptLocationCounts([
				lineContext({ index: 0, lineLocation: 'cupboard' }),
				lineContext({ index: 1, lineLocation: 'fridge' }),
				lineContext({ index: 2, lineLocation: 'fridge' })
			])
		).toEqual({ cupboard: 1, fridge: 2, freezer: 0 });
	});
});

describe('dominantStorageLocation', () => {
	it('picks the location with the highest count', () => {
		expect(dominantStorageLocation({ cupboard: 2, fridge: 5, freezer: 1 })).toBe('fridge');
	});
});

describe('receiptImportToastMessage', () => {
	it('appends price history line when linesWithPrice > 0', () => {
		const message = receiptImportToastMessage('sv', 2, {
			estimatedDates: 0,
			locationCorrections: 0,
			rulesImproved: 0
		}, 3);
		expect(message).toContain('Priser sparas i prishistorik');
	});
});

describe('markReceiptImportCompleted', () => {
	it('stores location counts and toast pending flag', () => {
		const storage = new Map<string, string>();
		vi.stubGlobal('sessionStorage', {
			setItem: (key: string, value: string) => storage.set(key, value),
			getItem: (key: string) => storage.get(key) ?? null,
			removeItem: (key: string) => storage.delete(key)
		});

		markReceiptImportCompleted(
			2,
			{ estimatedDates: 1, locationCorrections: 0, rulesImproved: 0 },
			{ cupboard: 1, fridge: 1, freezer: 0 },
			2
		);

		expect(storage.get(RECEIPT_IMPORT_JUST_COMPLETED_KEY)).toContain('"linesWithPrice":2');
		expect(storage.get(RECEIPT_IMPORT_JUST_COMPLETED_KEY)).toContain('"dominantLocation":"fridge"');
		expect(isReceiptImportToastPending()).toBe(true);
		expect(readReceiptImportCompleted()?.locationCounts).toEqual({
			cupboard: 1,
			fridge: 1,
			freezer: 0
		});

		clearReceiptImportSuccessPending();
		expect(isReceiptImportToastPending()).toBe(false);
	});
});

describe('aggregateReceiptImportSummary', () => {
	it('counts estimated dates when prediction is kept', () => {
		expect(
			aggregateReceiptImportSummary([
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
			]).estimatedDates
		).toBe(1);
	});
});
