import { browser } from '$app/environment';
import { isStorageLocation, type StorageLocation } from '$lib/domain/location';

const KEY = 'scan.last.defaults.v1';

export interface LastScanDefaults {
	location: StorageLocation;
}

export function getLastScanDefaults(): LastScanDefaults | null {
	if (!browser) return null;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { location?: unknown };
		const location = parsed.location;
		if (typeof location !== 'string' || !isStorageLocation(location)) return null;
		return { location };
	} catch {
		return null;
	}
}

export function saveLastScanDefaults(input: LastScanDefaults): void {
	if (!browser) return;
	window.localStorage.setItem(KEY, JSON.stringify(input));
}
