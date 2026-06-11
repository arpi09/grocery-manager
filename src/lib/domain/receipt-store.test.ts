import { describe, expect, it } from 'vitest';
import { extractPurchasedAtFromReceiptText, extractStoreFromReceiptText } from './receipt-store';

describe('receipt-store', () => {
	it('extracts known store labels from receipt header text', () => {
		expect(extractStoreFromReceiptText('ICA Kvantum\nKvitto 2026-06-10')).toBe('ICA');
		expect(extractStoreFromReceiptText('Willys Hemma\nOrg nr ...')).toBe('Willys');
		expect(extractStoreFromReceiptText('Hemköp City\nTack för ditt köp')).toBe('Hemköp');
	});

	it('extracts purchased date from common Swedish receipt date formats', () => {
		const iso = extractPurchasedAtFromReceiptText('Kvitto\n2026-06-10 18:33');
		expect(iso?.toISOString()).toBe('2026-06-10T12:00:00.000Z');

		const dmy = extractPurchasedAtFromReceiptText('Datum: 10/06/2026\nTid: 18:33');
		expect(dmy?.toISOString()).toBe('2026-06-10T12:00:00.000Z');
	});

	it('returns undefined when store/date cannot be detected', () => {
		expect(extractStoreFromReceiptText('Butik utan namn i listan')).toBeUndefined();
		expect(extractPurchasedAtFromReceiptText('Ingen datumrad här')).toBeUndefined();
	});
});
