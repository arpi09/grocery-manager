import { isBrowser } from '$lib/utils/device';

export type CapacitorPlatform = 'ios' | 'android' | 'web';

/** True when running inside a Capacitor native WebView (not mobile Safari/Chrome). */
export function isCapacitorNative(): boolean {
	if (!isBrowser()) {
		return false;
	}
	const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
	return cap?.isNativePlatform?.() === true;
}

/** `capacitor_ios` | `capacitor_android` | null for telemetry product_event source. */
export function capacitorTelemetrySource(): 'capacitor_ios' | 'capacitor_android' | null {
	if (!isCapacitorNative()) {
		return null;
	}
	const cap = (
		window as Window & { Capacitor?: { getPlatform?: () => CapacitorPlatform } }
	).Capacitor;
	const platform = cap?.getPlatform?.();
	if (platform === 'ios') {
		return 'capacitor_ios';
	}
	if (platform === 'android') {
		return 'capacitor_android';
	}
	return null;
}
