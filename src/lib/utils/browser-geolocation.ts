export type BrowserGeolocationErrorCode = 'unavailable' | 'denied' | 'timeout' | 'unknown';

export type BrowserGeolocationResult =
	| { ok: true; latitude: number; longitude: number }
	| { ok: false; code: BrowserGeolocationErrorCode };

export function mapGeolocationErrorCode(error: GeolocationPositionError): BrowserGeolocationErrorCode {
	switch (error.code) {
		case error.PERMISSION_DENIED:
			return 'denied';
		case error.POSITION_UNAVAILABLE:
			return 'unavailable';
		case error.TIMEOUT:
			return 'timeout';
		default:
			return 'unknown';
	}
}

/** Call synchronously from a user gesture (required on iOS Safari). */
export function requestBrowserLocation(
	options: PositionOptions = {
		enableHighAccuracy: true,
		timeout: 15_000,
		maximumAge: 0
	}
): Promise<BrowserGeolocationResult> {
	if (typeof navigator === 'undefined' || !navigator.geolocation) {
		return Promise.resolve({ ok: false, code: 'unavailable' });
	}

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({
					ok: true,
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				}),
			(error) => resolve({ ok: false, code: mapGeolocationErrorCode(error) }),
			options
		);
	});
}
