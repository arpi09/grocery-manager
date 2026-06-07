import type { InventoryItem } from '$lib/domain/inventory-item';
import type { StorageLocation } from '$lib/domain/location';

export interface InventoryActivePage {
	items: InventoryItem[];
	total: number;
}

export interface InventoryFinishedPage {
	items: InventoryItem[];
	total: number;
}

export interface InventoryAutoExpiredPage {
	items: InventoryItem[];
	total: number;
}

export async function fetchInventoryActivePage(
	location: StorageLocation,
	offset = 0,
	limit?: number
): Promise<InventoryActivePage> {
	const search = new URLSearchParams({
		section: 'active',
		location,
		offset: String(offset)
	});
	if (limit !== undefined) {
		search.set('limit', String(limit));
	}

	const response = await fetch(`/api/inventory/data?${search}`);
	if (!response.ok) {
		throw new Error(`Inventory data request failed (${response.status})`);
	}

	return (await response.json()) as InventoryActivePage;
}

export async function fetchInventoryFinished(
	location: StorageLocation
): Promise<InventoryFinishedPage> {
	const search = new URLSearchParams({ section: 'finished', location });
	const response = await fetch(`/api/inventory/data?${search}`);
	if (!response.ok) {
		throw new Error(`Inventory data request failed (${response.status})`);
	}

	return (await response.json()) as InventoryFinishedPage;
}

export async function fetchInventoryAutoExpired(
	location: StorageLocation
): Promise<InventoryAutoExpiredPage> {
	const search = new URLSearchParams({ section: 'autoExpired', location });
	const response = await fetch(`/api/inventory/data?${search}`);
	if (!response.ok) {
		throw new Error(`Inventory data request failed (${response.status})`);
	}

	return (await response.json()) as InventoryAutoExpiredPage;
}

export async function fetchInventorySearch(
	location: StorageLocation,
	query: string
): Promise<InventoryActivePage> {
	const search = new URLSearchParams({
		section: 'active',
		location,
		q: query
	});
	const response = await fetch(`/api/inventory/data?${search}`);
	if (!response.ok) {
		throw new Error(`Inventory data request failed (${response.status})`);
	}

	return (await response.json()) as InventoryActivePage;
}
