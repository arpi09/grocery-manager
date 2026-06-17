import { describe, expect, it } from 'vitest';
import {
	deriveHouseholdShoppingCadence,
	formatCadenceWeekday,
	HOUSEHOLD_CADENCE_MIN_TRIPS
} from './household-shopping-cadence';
import type { ReceiptPurchaseLineRecord } from './purchase-pattern';

function line(partial: Partial<ReceiptPurchaseLineRecord> & Pick<ReceiptPurchaseLineRecord, 'importBatchId'>): ReceiptPurchaseLineRecord {
	return {
		id: partial.id ?? 'l1',
		householdId: 'h1',
		userId: 'u1',
		importBatchId: partial.importBatchId,
		productName: 'Mjolk',
		normalizedKey: 'mjolk',
		barcode: null,
		location: 'fridge',
		quantity: '1',
		unit: null,
		unitPrice: null,
		currency: 'SEK',
		lineTotal: null,
		storeLabel: partial.storeLabel ?? null,
		purchasedAt: partial.purchasedAt ?? null,
		inventoryItemId: partial.inventoryItemId ?? null,
		conceptKey: partial.conceptKey ?? partial.normalizedKey ?? 'mjolk',
		matchSource: partial.matchSource ?? null,
		importSource: partial.importSource ?? 'unknown',
		lineIndex: partial.lineIndex ?? 0,
		createdAt: partial.createdAt ?? new Date('2026-01-05T12:00:00Z')
	};
}

describe('deriveHouseholdShoppingCadence', () => {
	it('needs at least two trips', () => {
		expect(deriveHouseholdShoppingCadence([line({ importBatchId: 'a' })])).toBeNull();
	});

	it('picks dominant weekday and store among matching trips', () => {
		const sunday = new Date('2026-01-05T10:00:00Z');
		const nextSunday = new Date('2026-01-12T10:00:00Z');
		const result = deriveHouseholdShoppingCadence([
			line({ importBatchId: 'a', purchasedAt: sunday, storeLabel: 'ICA' }),
			line({ importBatchId: 'b', purchasedAt: nextSunday, storeLabel: 'ICA' }),
			line({ importBatchId: 'c', purchasedAt: new Date('2026-01-07T10:00:00Z'), storeLabel: 'Willys' })
		]);
		expect(result?.weekday).toBe(sunday.getUTCDay());
		expect(result?.storeLabel).toBe('ICA');
		expect(result?.tripCount).toBeGreaterThanOrEqual(HOUSEHOLD_CADENCE_MIN_TRIPS);
	});
});

describe('formatCadenceWeekday', () => {
	it('formats sv weekday', () => {
		expect(formatCadenceWeekday(0, 'sv').length).toBeGreaterThan(3);
	});
});
