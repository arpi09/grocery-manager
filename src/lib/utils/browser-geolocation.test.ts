import { describe, expect, it } from 'vitest';
import { mapGeolocationErrorCode } from './browser-geolocation';

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
