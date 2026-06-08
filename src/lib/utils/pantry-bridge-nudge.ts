import type { StorageLocation } from '$lib/domain/location';

const SESSION_PREFIX = 'pantry-bridge-yes-';

export function recordPantryBridgeYes(location: StorageLocation): number {
	if (typeof sessionStorage === 'undefined') {
		return 0;
	}
	const key = `${SESSION_PREFIX}${location}`;
	const next = Number(sessionStorage.getItem(key) ?? '0') + 1;
	sessionStorage.setItem(key, String(next));
	return next;
}

export function getPantryBridgeYesCount(location: StorageLocation): number {
	if (typeof sessionStorage === 'undefined') {
		return 0;
	}
	return Number(sessionStorage.getItem(`${SESSION_PREFIX}${location}`) ?? '0');
}

export function clearPantryBridgeYesCount(location: StorageLocation): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.removeItem(`${SESSION_PREFIX}${location}`);
}
