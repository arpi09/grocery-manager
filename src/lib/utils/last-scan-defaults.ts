import { browser } from '$app/environment';
import { isStorageLocation, type StorageLocation } from '$lib/domain/location';
import type { ScanMode } from '$lib/utils/scan-nav';

const KEY = 'scan.last.defaults.v1';

export type LastScanMode = Exclude<ScanMode, 'hub'>;

/** New users without scan history — kvitto-first narrative. */
export const DEFAULT_SCAN_MODE: LastScanMode = 'receipt';

export interface LastScanDefaults {
	mode?: LastScanMode;
	location: StorageLocation;
}

function isLastScanMode(value: unknown): value is LastScanMode {
	return value === 'barcode' || value === 'receipt' || value === 'photo';
}

export function getLastScanDefaults(): LastScanDefaults | null {
	if (!browser) return null;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { location?: unknown; mode?: unknown };
		const location = parsed.location;
		if (typeof location !== 'string' || !isStorageLocation(location)) return null;
		const mode = isLastScanMode(parsed.mode) ? parsed.mode : undefined;
		return mode ? { location, mode } : { location };
	} catch {
		return null;
	}
}

export function saveLastScanDefaults(input: LastScanDefaults): void {
	if (!browser) return;
	const existing = getLastScanDefaults();
	window.localStorage.setItem(
		KEY,
		JSON.stringify({
			location: input.location ?? existing?.location ?? 'fridge',
			mode: input.mode ?? existing?.mode ?? DEFAULT_SCAN_MODE
		})
	);
}

export function getLastScanMode(): LastScanMode {
	return getLastScanDefaults()?.mode ?? DEFAULT_SCAN_MODE;
}

export function saveLastScanMode(mode: LastScanMode): void {
	const existing = getLastScanDefaults();
	saveLastScanDefaults({
		location: existing?.location ?? 'fridge',
		mode
	});
}
