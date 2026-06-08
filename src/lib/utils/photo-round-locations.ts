import type { StorageLocation } from '$lib/domain/location';
import { normalizeInventoryItemName } from '$lib/domain/inventory-merge';
import { isBrowser } from '$lib/utils/device';

const STORAGE_KEY = 'home-pantry:photo-round-locations';
const LAST_LOCATION_KEY = 'home-pantry:photo-round-last-location';

type LocationMap = Record<string, StorageLocation>;

function readMap(): LocationMap {
	if (!isBrowser()) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as LocationMap;
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function writeMap(map: LocationMap): void {
	if (!isBrowser()) return;
	const entries = Object.entries(map).slice(0, 120);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

export function getPhotoRoundLastLocation(name: string): StorageLocation | null {
	const key = normalizeInventoryItemName(name);
	return readMap()[key] ?? null;
}

export function getLastPhotoRoundLocation(): StorageLocation | null {
	if (!isBrowser()) return null;
	const raw = localStorage.getItem(LAST_LOCATION_KEY);
	return raw === 'fridge' || raw === 'freezer' || raw === 'cupboard' ? raw : null;
}

export function savePhotoRoundLocation(location: StorageLocation): void {
	if (!isBrowser()) return;
	localStorage.setItem(LAST_LOCATION_KEY, location);
}

export function savePhotoRoundLocations(
	lines: Array<{ name: string; location: StorageLocation }>
): void {
	const map = readMap();
	for (const line of lines) {
		const key = normalizeInventoryItemName(line.name);
		if (!key) continue;
		map[key] = line.location;
		savePhotoRoundLocation(line.location);
	}
	writeMap(map);
}

export function applyPhotoRoundLastLocations<T extends { name: string; location: StorageLocation }>(
	lines: T[]
): T[] {
	return lines.map((line) => {
		const last = getPhotoRoundLastLocation(line.name);
		return last ? { ...line, location: last } : line;
	});
}
