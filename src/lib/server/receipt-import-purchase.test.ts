import { describe, expect, it } from 'vitest';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import {
	parseOptionalPriceField,
	parseOptionalPurchasedAt,
	parseOptionalQuantity,
	receiptLineToPurchaseRecord
} from './receipt-import-purchase';

describe('receiptLineToPurchaseRecord', () => {
	const baseLine: ReceiptLine = {
		name: ' Arla Mjölk 1L ',
		location: 'fridge',
		unitPrice: '14,90 kr',
		lineTotal: '29,80',
		currency: 'sek'
	};

	it('maps receipt line fields into purchase import input', () => {
		const record = receiptLineToPurchaseRecord({
			householdId: 'house-1',
			userId: 'user-1',
			importBatchId: 'batch-1',
			line: baseLine,
			location: 'fridge',
			quantity: '2',
			unit: 'L',
			storeLabel: ' ICA ',
			purchasedAt: '2026-06-01',
			lineIndex: 3,
			importSource: 'receipt_scan',
			inventoryItemId: 'item-99',
			matchSource: 'inventory_item'
		});

		expect(record).toMatchObject({
			householdId: 'house-1',
			userId: 'user-1',
			importBatchId: 'batch-1',
			productName: 'Arla Mjölk 1L',
			location: 'fridge',
			quantity: '2',
			unit: 'L',
			unitPrice: '14.90',
			lineTotal: '29.80',
			currency: 'SEK',
			storeLabel: 'ICA',
			purchasedAt: new Date('2026-06-01'),
			lineIndex: 3,
			importSource: 'receipt_scan',
			inventoryItemId: 'item-99',
			matchSource: 'inventory_item'
		});
		expect(record.conceptKey).toBeTruthy();
	});

	it('defaults matchSource to normalized_key when no inventory item id', () => {
		const record = receiptLineToPurchaseRecord({
			householdId: 'house-1',
			userId: 'user-1',
			importBatchId: 'batch-1',
			line: { name: 'Bröd', location: 'cupboard' },
			location: 'cupboard',
			quantity: null,
			unit: null
		});

		expect(record.matchSource).toBe('normalized_key');
		expect(record.inventoryItemId).toBeNull();
		expect(record.importSource).toBe('unknown');
	});
});

describe('parseOptionalPurchasedAt', () => {
	it('returns null for invalid dates', () => {
		expect(parseOptionalPurchasedAt('not-a-date')).toBeNull();
	});
});

describe('parseOptionalQuantity', () => {
	it('normalizes comma decimals and trims trailing zeros', () => {
		expect(parseOptionalQuantity('1,50')).toBe('1.5');
		expect(parseOptionalQuantity('2.00')).toBe('2');
	});

	it('returns null for empty or invalid quantity strings', () => {
		expect(parseOptionalQuantity('')).toBeNull();
		expect(parseOptionalQuantity('abc')).toBeNull();
	});
});

describe('parseOptionalPriceField', () => {
	it('parses numeric input', () => {
		expect(parseOptionalPriceField(12)).toBe('12.00');
	});
});
