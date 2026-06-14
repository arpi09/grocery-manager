import { describe, expect, it } from 'vitest';
import { manualAddHref, parseScanMode, parseScanReturnTo, scanModeHref } from './scan-nav';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

describe('scan-nav', () => {
	it('parseScanMode maps known modes', () => {
		expect(parseScanMode('barcode')).toBe('barcode');
		expect(parseScanMode('receipt')).toBe('receipt');
		expect(parseScanMode('photo')).toBe('photo');
		expect(parseScanMode(null)).toBe('hub');
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

	it('manualAddHref returns to photo scan on cancel', () => {
		expect(manualAddHref('/hem')).toBe(
			'/item/new?from=%2Fscan%3Ffrom%3D%252Fhem%26mode%3Dphoto'
		);
		expect(manualAddHref('/inventory/fridge', { location: 'fridge' })).toBe(
			'/item/new?from=%2Fscan%3Ffrom%3D%252Finventory%252Ffridge%26mode%3Dphoto%26location%3Dfridge&location=fridge'
		);
	});
});
