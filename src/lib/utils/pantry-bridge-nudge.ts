import type { StorageLocation } from '$lib/domain/location';

const SESSION_PREFIX = 'pantry-bridge-yes-';
const HISTORY_PREFIX = 'pantry-bridge-yes-history:';
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const PANTRY_BRIDGE_ALWAYS_THRESHOLD = 3;
const FIRST_COACH_PREFIX = 'pantry-bridge-first-coach:';

function readHistory(userId: string): number[] {
	if (typeof localStorage === 'undefined') {
		return [];
	}
	const raw = localStorage.getItem(`${HISTORY_PREFIX}${userId}`);
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.filter((entry): entry is number => typeof entry === 'number');
	} catch {
		return [];
	}
}

function writeHistory(userId: string, timestamps: number[]): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	localStorage.setItem(`${HISTORY_PREFIX}${userId}`, JSON.stringify(timestamps));
}

function pruneHistory(timestamps: number[], now: number): number[] {
	return timestamps.filter((entry) => now - entry <= WINDOW_MS);
}

export function recordPantryBridgeYes(userId: string, location: StorageLocation): number {
	if (typeof sessionStorage !== 'undefined') {
		const key = `${SESSION_PREFIX}${location}`;
		const next = Number(sessionStorage.getItem(key) ?? '0') + 1;
		sessionStorage.setItem(key, String(next));
	}

	if (typeof localStorage === 'undefined') {
		return 0;
	}

	const now = Date.now();
	const nextHistory = pruneHistory([...readHistory(userId), now], now);
	writeHistory(userId, nextHistory);
	return nextHistory.length;
}

export function getPantryBridgeYesCount(location: StorageLocation): number {
	if (typeof sessionStorage === 'undefined') {
		return 0;
	}
	return Number(sessionStorage.getItem(`${SESSION_PREFIX}${location}`) ?? '0');
}

export function getPantryBridgeYesCountForUser(userId: string, now = Date.now()): number {
	return pruneHistory(readHistory(userId), now).length;
}

export function shouldShowPantryBridgeAlwaysNudge(userId: string, now = Date.now()): boolean {
	return getPantryBridgeYesCountForUser(userId, now) >= PANTRY_BRIDGE_ALWAYS_THRESHOLD;
}

export function clearPantryBridgeYesCount(location: StorageLocation): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.removeItem(`${SESSION_PREFIX}${location}`);
}

export function clearPantryBridgeYesHistory(userId: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	localStorage.removeItem(`${HISTORY_PREFIX}${userId}`);
}

export function shouldShowFirstCheckoffCoach(userId: string): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}
	return localStorage.getItem(`${FIRST_COACH_PREFIX}${userId}`) !== '1';
}

export function markFirstCheckoffCoachSeen(userId: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	localStorage.setItem(`${FIRST_COACH_PREFIX}${userId}`, '1');
}
