import { describe, expect, it } from 'vitest';
import {
	isNonScanHubReceiptSource,
	parseReceiptImportSource,
	RECEIPT_IMPORT_SOURCES
} from './receipt-import-source';

describe('receipt-import-source', () => {
	it('lists all funnel sources', () => {
		expect(RECEIPT_IMPORT_SOURCES).toEqual([
			'one_tap',
			'share_target',
			'scan_hub',
			'onboarding'
		]);
	});

	it('parses known sources', () => {
		expect(parseReceiptImportSource('one_tap')).toBe('one_tap');
		expect(parseReceiptImportSource('share_target')).toBe('share_target');
		expect(parseReceiptImportSource('onboarding')).toBe('onboarding');
	});

	it('defaults unknown sources to scan_hub', () => {
		expect(parseReceiptImportSource(null)).toBe('scan_hub');
		expect(parseReceiptImportSource('')).toBe('scan_hub');
		expect(parseReceiptImportSource('kivra_api')).toBe('scan_hub');
	});

	it('detects non scan_hub sources', () => {
		expect(isNonScanHubReceiptSource('one_tap')).toBe(true);
		expect(isNonScanHubReceiptSource('scan_hub')).toBe(false);
	});
});
