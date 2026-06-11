export type BrowserGeolocationErrorCode =
	| 'unavailable'
	| 'denied'
	| 'blocked'
	| 'timeout'
	| 'unknown';

export type GeolocationPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

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

/** Refine a denial when Permissions API shows prompt was still possible (no prompt shown). */
export function refineGeolocationErrorCode(
	code: BrowserGeolocationErrorCode,
	permission: GeolocationPermissionState
): BrowserGeolocationErrorCode {
	if (code !== 'denied') {
		return code;
	}
	// iOS Safari returns PERMISSION_DENIED without a prompt when the call is not in a user gesture.
	if (permission === 'prompt' || permission === 'unknown') {
		return 'blocked';
	}
	return 'denied';
}

export async function queryGeolocationPermission(): Promise<GeolocationPermissionState> {
	if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
		return 'unknown';
	}
	try {
		const status = await navigator.permissions.query({ name: 'geolocation' });
		return status.state as GeolocationPermissionState;
	} catch {
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

/**
 * Start a browser location request synchronously — call directly from a click/tap handler.
 * iOS Safari only shows the permission prompt when getCurrentPosition runs in the gesture turn.
 */
export function startBrowserLocationRequest(): Promise<BrowserGeolocationResult> {
	if (typeof navigator === 'undefined' || !navigator.geolocation) {
		return Promise.resolve({ ok: false, code: 'unavailable' });
	}

	// Invoke Geolocation API synchronously before any await in this function.
	const accuratePromise = getCurrentPosition({
		enableHighAccuracy: true,
		timeout: 12_000,
		maximumAge: 0
	});

	return (async () => {
		const accurate = await accuratePromise;
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
	})();
}

/** Prefer startBrowserLocationRequest when called from a user gesture handler. */
export function requestBrowserLocation(): Promise<BrowserGeolocationResult> {
	return startBrowserLocationRequest();
}
