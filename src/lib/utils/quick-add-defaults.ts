import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
import { isBrowser } from '$lib/utils/device';

const STORAGE_KEY = 'home-pantry:quick-add-default-location';

export function getQuickAddDefaultLocation(): StorageLocation {
	if (!isBrowser()) return 'fridge';
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw && LOCATIONS.includes(raw as StorageLocation)) {
			return raw as StorageLocation;
		}
	} catch {
		// ignore
	}
	return 'fridge';
}

export function saveQuickAddDefaultLocation(location: StorageLocation): void {
	if (!isBrowser()) return;
	localStorage.setItem(STORAGE_KEY, location);
}
