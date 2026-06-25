import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getLastScanMode,
	manualAddHref,
	parseScanMode,
	parseScanReturnTo,
	preferredScanHref,
	recordLastScanMode,
	scanModeHref
} from './scan-nav';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

describe('scan-nav', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('parseScanMode maps known modes', () => {
		expect(parseScanMode('barcode')).toBe('barcode');
		expect(parseScanMode('receipt')).toBe('receipt');
		expect(parseScanMode('photo')).toBe('photo');
		expect(parseScanMode(null)).toBe('photo');
		expect(parseScanMode('nope')).toBe('photo');
	});

	it('defaults to last-used scan mode', () => {
		recordLastScanMode('receipt');
		expect(getLastScanMode()).toBe('receipt');
		expect(parseScanMode(null)).toBe('receipt');
		expect(preferredScanHref('/hem')).toBe('/scan?from=%2Fhem&mode=receipt');
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

	it('manualAddHref returns to scan hub on cancel', () => {
		expect(manualAddHref('/hem')).toBe(
			'/item/new?from=%2Fscan%3Ffrom%3D%252Fhem%26mode%3Dhub'
		);
		expect(manualAddHref('/inventory/fridge', { location: 'fridge' })).toBe(
			'/item/new?from=%2Fscan%3Ffrom%3D%252Finventory%252Ffridge%26mode%3Dhub&location=fridge'
		);
	});
});
