import type { StorageLocation } from '$lib/domain/location';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

export type ScanMode = 'hub' | 'barcode' | 'receipt' | 'photo';

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
	return 'photo';
}

/** Build the scan hub URL with a safe return path. */
export function scanHubHref(returnTo: string): string {
	const params = new URLSearchParams({ from: returnTo, mode: 'hub' });
	return `/scan?${params}`;
}

/** Preferred scan entry from nav: a top-level page, not a return-to sub-flow. */
export function preferredScanHref(): string {
	return '/scan';
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
