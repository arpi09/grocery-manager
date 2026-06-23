import { describe, expect, it } from 'vitest';
import {
	extractPrintedBbfDatesFromReceiptText,
	extractPrintedBbfForProductLine
} from './receipt-printed-bbf';

describe('receipt-printed-bbf', () => {
	it('extracts ISO dates from receipt text', () => {
		const text = 'Mjölk 3% 2026-06-15 29,90';
		expect(extractPrintedBbfDatesFromReceiptText(text)).toContain('2026-06-15');
	});

	it('extracts BF compact format', () => {
		const text = 'Yoghurt BF 250615 19,90';
		expect(extractPrintedBbfDatesFromReceiptText(text)).toContain('2025-06-15');
	});

	it('finds BBF near product name', () => {
		const text = 'Arla Mjölk 3% 1,5L 2026-06-15 34,90';
		expect(extractPrintedBbfForProductLine(text, 'Mjölk 3%')).toBe('2026-06-15');
	});
});
