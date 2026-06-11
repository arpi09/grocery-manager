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

function getCurrentPosition(options: PositionOptions): Promise<BrowserGeolocationResult> {
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

/** Call synchronously from a user gesture (required on iOS Safari). */
export async function requestBrowserLocation(): Promise<BrowserGeolocationResult> {
	if (typeof navigator === 'undefined' || !navigator.geolocation) {
		return { ok: false, code: 'unavailable' };
	}

	const accurate = await getCurrentPosition({
		enableHighAccuracy: true,
		timeout: 12_000,
		maximumAge: 0
	});
	if (accurate.ok) {
		return accurate;
	}

	if (accurate.code === 'timeout' || accurate.code === 'unavailable') {
		const fallback = await getCurrentPosition({
			enableHighAccuracy: false,
			timeout: 15_000,
			maximumAge: 60_000
		});
		if (fallback.ok) {
			return fallback;
		}
	}

	return accurate;
}
