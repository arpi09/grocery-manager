import { describe, expect, it } from 'vitest';
import { parseScanMode, parseScanReturnTo, scanModeHref } from './scan-nav';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

describe('scan-nav', () => {
	it('parseScanMode maps known modes', () => {
		expect(parseScanMode('barcode')).toBe('barcode');
		expect(parseScanMode('receipt')).toBe('receipt');
		expect(parseScanMode('photo')).toBe('photo');
		expect(parseScanMode(null)).toBe('photo');
		expect(parseScanMode('nope')).toBe('photo');
	});

	it('parseScanReturnTo falls back to app home', () => {
		expect(parseScanReturnTo('/inventory/fridge')).toBe('/inventory/fridge');
		expect(parseScanReturnTo(null)).toBe(APP_HOME_PATH);
		expect(parseScanReturnTo('https://evil.test')).toBe(APP_HOME_PATH);
	});

	it('scanModeHref omits mode query for hub', () => {
		expect(scanModeHref('hub', '/hem')).toBe('/scan?from=%2Fhem');
		expect(scanModeHref('receipt', '/hem')).toBe('/scan?from=%2Fhem&mode=receipt');
	});
});
