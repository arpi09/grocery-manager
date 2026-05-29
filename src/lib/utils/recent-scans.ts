import { isBrowser } from '$lib/utils/device';

const STORAGE_KEY = 'home-pantry:recent-scans';
const MAX_RECENT = 5;

export interface RecentScan {
	barcode: string;
	name: string;
	scannedAt: number;
}

function readAll(): RecentScan[] {
	if (!isBrowser()) {
		return [];
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw) as RecentScan[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function writeAll(scans: RecentScan[]): void {
	if (!isBrowser()) {
		return;
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.slice(0, MAX_RECENT)));
}

export function getRecentScans(): RecentScan[] {
	return readAll().sort((a, b) => b.scannedAt - a.scannedAt);
}

export function addRecentScan(entry: Omit<RecentScan, 'scannedAt'> & { scannedAt?: number }): void {
	const scannedAt = entry.scannedAt ?? Date.now();
	const next: RecentScan = { barcode: entry.barcode, name: entry.name, scannedAt };
	const withoutDuplicate = readAll().filter((s) => s.barcode !== next.barcode);
	writeAll([next, ...withoutDuplicate]);
}

export function removeRecentScan(barcode: string): void {
	writeAll(readAll().filter((s) => s.barcode !== barcode));
}
