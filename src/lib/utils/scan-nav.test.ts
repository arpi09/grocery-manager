import { describe, expect, it } from 'vitest';
import { parseScanMode, scanModeHref } from './scan-nav';

describe('scan-nav', () => {
	it('parseScanMode maps known modes', () => {
		expect(parseScanMode('barcode')).toBe('barcode');
		expect(parseScanMode('receipt')).toBe('receipt');
		expect(parseScanMode('photo')).toBe('photo');
		expect(parseScanMode(null)).toBe('hub');
		expect(parseScanMode('nope')).toBe('hub');
	});

	it('scanModeHref omits mode query for hub', () => {
		expect(scanModeHref('hub', '/hem')).toBe('/scan?from=%2Fhem');
		expect(scanModeHref('receipt', '/hem')).toBe('/scan?from=%2Fhem&mode=receipt');
	});
});
