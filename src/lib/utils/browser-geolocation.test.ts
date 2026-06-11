import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	mapGeolocationErrorCode,
	queryGeolocationPermission,
	refineGeolocationErrorCode,
	requestBrowserLocation,
	startBrowserLocationRequest
} from './browser-geolocation';

describe('mapGeolocationErrorCode', () => {
	it('maps permission denied', () => {
		expect(mapGeolocationErrorCode({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)).toBe(
			'denied'
		);
	});

	it('maps position unavailable', () => {
		expect(
			mapGeolocationErrorCode({ code: 2, POSITION_UNAVAILABLE: 2 } as GeolocationPositionError)
		).toBe('unavailable');
	});

	it('maps timeout', () => {
		expect(mapGeolocationErrorCode({ code: 3, TIMEOUT: 3 } as GeolocationPositionError)).toBe(
			'timeout'
		);
	});

	it('maps unknown codes', () => {
		expect(mapGeolocationErrorCode({ code: 99 } as GeolocationPositionError)).toBe('unknown');
	});
});

describe('refineGeolocationErrorCode', () => {
	it('maps denied + prompt to blocked (no prompt shown)', () => {
		expect(refineGeolocationErrorCode('denied', 'prompt')).toBe('blocked');
	});

	it('keeps denied when permission is denied', () => {
		expect(refineGeolocationErrorCode('denied', 'denied')).toBe('denied');
	});

	it('passes through non-denied codes', () => {
		expect(refineGeolocationErrorCode('timeout', 'prompt')).toBe('timeout');
	});
});

describe('queryGeolocationPermission', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns unknown when Permissions API is missing', async () => {
		vi.stubGlobal('navigator', {});
		await expect(queryGeolocationPermission()).resolves.toBe('unknown');
	});

	it('returns permission state from Permissions API', async () => {
		vi.stubGlobal('navigator', {
			permissions: {
				query: vi.fn().mockResolvedValue({ state: 'prompt' })
			}
		});
		await expect(queryGeolocationPermission()).resolves.toBe('prompt');
	});
});

describe('requestBrowserLocation', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns unavailable when geolocation is missing', async () => {
		vi.stubGlobal('navigator', {});
		await expect(requestBrowserLocation()).resolves.toEqual({ ok: false, code: 'unavailable' });
	});

	it('returns coordinates from high-accuracy attempt', async () => {
		const getCurrentPosition = vi.fn((_success: PositionCallback, _error?: PositionErrorCallback, options?: PositionOptions) => {
			if (options?.enableHighAccuracy) {
				_success({
					coords: { latitude: 59.33, longitude: 18.07, accuracy: 10 },
					timestamp: Date.now()
				} as GeolocationPosition);
			}
		});
		vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });

		await expect(requestBrowserLocation()).resolves.toEqual({
			ok: true,
			latitude: 59.33,
			longitude: 18.07
		});
		expect(getCurrentPosition).toHaveBeenCalledTimes(1);
	});

	it('falls back when high-accuracy times out', async () => {
		const getCurrentPosition = vi.fn((success: PositionCallback, _error?: PositionErrorCallback, options?: PositionOptions) => {
			if (options?.enableHighAccuracy) {
				_error?.({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'timeout' } as GeolocationPositionError);
				return;
			}
			success({
				coords: { latitude: 59.1, longitude: 18.0, accuracy: 500 },
				timestamp: Date.now()
			} as GeolocationPosition);
		});
		vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });

		await expect(requestBrowserLocation()).resolves.toEqual({
			ok: true,
			latitude: 59.1,
			longitude: 18.0
		});
		expect(getCurrentPosition).toHaveBeenCalledTimes(2);
	});

	it('startBrowserLocationRequest invokes geolocation synchronously', () => {
		const getCurrentPosition = vi.fn();
		vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });

		void startBrowserLocationRequest();

		expect(getCurrentPosition).toHaveBeenCalledTimes(1);
		expect(getCurrentPosition.mock.calls[0]?.[2]).toMatchObject({ enableHighAccuracy: true });
	});
});
