import { trackProductEvent } from '$lib/client/product-events';
import type { StorageLocation } from '$lib/domain/location';

export function trackPantryShelfOpened(totalItems: number, useSoonCount: number): void {
	void trackProductEvent('pantry_shelf_opened', { totalItems, useSoonCount });
}

export function trackPantryZoneOpened(zone: StorageLocation, itemCount: number): void {
	void trackProductEvent('pantry_zone_opened', { zone, itemCount });
}

export function trackPantryItemOpened(
	itemId: string,
	zone: StorageLocation,
	from: 'tile' | 'table'
): void {
	void trackProductEvent('pantry_item_opened', { itemId, zone, from });
}

export function trackPantryUseSoonTapped(count: number): void {
	void trackProductEvent('pantry_use_soon_tapped', { count });
}
