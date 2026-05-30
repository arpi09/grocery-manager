import { isBrowser } from '$lib/utils/device';

const STORAGE_KEY = 'home-pantry:favorite-products';
const MAX_FAVORITES = 20;

export interface FavoriteProduct {
	barcode: string;
	name: string;
	quantity: string;
	unit: string | null;
	notes: string | null;
	savedAt: number;
}

function readAll(): FavoriteProduct[] {
	if (!isBrowser()) {
		return [];
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw) as FavoriteProduct[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function writeAll(products: FavoriteProduct[]): void {
	if (!isBrowser()) {
		return;
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(products.slice(0, MAX_FAVORITES)));
}

export function getFavoriteProducts(): FavoriteProduct[] {
	return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function getFavoriteProduct(barcode: string): FavoriteProduct | null {
	const normalized = barcode.replace(/\D/g, '');
	return readAll().find((p) => p.barcode === normalized) ?? null;
}

export function saveFavoriteProduct(
	entry: Omit<FavoriteProduct, 'savedAt'> & { savedAt?: number }
): void {
	const savedAt = entry.savedAt ?? Date.now();
	const normalized = entry.barcode.replace(/\D/g, '');
	if (normalized.length < 8 || !entry.name.trim()) {
		return;
	}

	const next: FavoriteProduct = {
		barcode: normalized,
		name: entry.name.trim(),
		quantity: entry.quantity.trim() || '1',
		unit: entry.unit?.trim() || null,
		notes: entry.notes?.trim() || null,
		savedAt
	};

	const withoutDuplicate = readAll().filter((p) => p.barcode !== normalized);
	writeAll([next, ...withoutDuplicate]);
}

export function removeFavoriteProduct(barcode: string): void {
	const normalized = barcode.replace(/\D/g, '');
	writeAll(readAll().filter((p) => p.barcode !== normalized));
}
