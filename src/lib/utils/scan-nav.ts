import type { StorageLocation } from '$lib/domain/location';
import {
	parseReceiptImportSource,
	type ReceiptImportSource
} from '$lib/domain/receipt-import-source';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

export type ScanMode = 'hub' | 'barcode' | 'receipt' | 'photo';

const LAST_SCAN_MODE_KEY = 'home-pantry-last-scan-mode';
const DEFAULT_SCAN_MODE: ScanMode = 'photo';

/** Safe in-app return path from a `from` query param. */
export function parseScanReturnTo(fromParam: string | null): string {
	if (fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//')) {
		return fromParam;
	}
	return APP_HOME_PATH;
}

export function parseScanMode(value: string | null): ScanMode {
	if (value === 'hub') {
		return 'hub';
	}
	if (value === 'barcode' || value === 'receipt' || value === 'photo') {
		return value;
	}
	if (value === null) {
		return getLastScanMode();
	}
	return DEFAULT_SCAN_MODE;
}

export function getLastScanMode(): ScanMode {
	if (typeof localStorage === 'undefined') {
		return DEFAULT_SCAN_MODE;
	}

	const stored = localStorage.getItem(LAST_SCAN_MODE_KEY);
	if (stored === 'barcode' || stored === 'receipt' || stored === 'photo') {
		return stored;
	}

	return DEFAULT_SCAN_MODE;
}

export function recordLastScanMode(mode: ScanMode): void {
	if (mode === 'hub' || typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(LAST_SCAN_MODE_KEY, mode);
}

/** Build the scan hub URL with a safe return path. */
export function scanHubHref(returnTo: string): string {
	const params = new URLSearchParams({ from: returnTo, mode: 'hub' });
	return `/scan?${params}`;
}

/** Preferred scan entry from nav: last-used mode (default photo), not the hub. */
export function preferredScanHref(returnTo: string = APP_HOME_PATH): string {
	return scanModeHref(getLastScanMode(), returnTo);
}

/** Scan URL for a specific mode (hub omits `mode` query). */
export function scanModeHref(
	mode: ScanMode,
	returnTo: string,
	options?: { location?: StorageLocation | string }
): string {
	const params = new URLSearchParams({ from: returnTo });
	if (mode !== 'hub') {
		params.set('mode', mode);
	}
	if (options?.location) {
		params.set('location', options.location);
	}
	return `/scan?${params}`;
}

/** Return path for sub-flows that should back-navigate to the scan hub first. */
export function scanSubFlowFrom(returnTo: string): string {
	return scanHubHref(returnTo);
}

/** Manual add from scan — back returns to scan hub. */
export function manualAddHref(
	returnTo: string,
	options?: { location?: StorageLocation | string }
): string {
	const from = scanHubHref(returnTo);
	const params = new URLSearchParams({ from });
	if (options?.location) {
		params.set('location', String(options.location));
	}
	return `/item/new?` + params.toString();
}

/** Scan hub entry during activation onboarding — preserves return path and context. */
export function activationScanHref(returnTo: string = APP_HOME_PATH): string {
	const params = new URLSearchParams({ from: returnTo, onboarding: 'activation' });
	return `/scan?${params}`;
}

export function isActivationOnboardingContext(searchParams: URLSearchParams): boolean {
	return searchParams.get('onboarding') === 'activation';
}

export function parseReceiptImportSourceFromParams(
	searchParams: URLSearchParams
): ReceiptImportSource {
	if (isActivationOnboardingContext(searchParams)) {
		return 'onboarding';
	}
	return parseReceiptImportSource(searchParams.get('source'));
}

/** One-tap receipt import — opens file picker on mount (no scan hub). */
export function receiptOneTapHref(returnTo: string = APP_HOME_PATH): string {
	const params = new URLSearchParams({
		from: returnTo,
		mode: 'receipt',
		source: 'one_tap',
		autopick: '1'
	});
	return `/scan?${params}`;
}
