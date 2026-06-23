import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { EXPIRING_SOON_DAYS, daysUntilExpiry } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import { isItemFinished, type InventoryItem } from '$lib/domain/inventory-item';
import { LOCATIONS, type StorageLocation } from '$lib/domain/location';

export const MAX_TILES_PER_ZONE = 6;
export const USE_SOON_LIST_MAX = 4;
export const USE_SOON_DAYS = EXPIRING_SOON_DAYS;

export type PantryTileDetailKind =
	| 'expires_today'
	| 'expires_days'
	| 'expires_date'
	| 'missing_expiry'
	| 'frozen'
	| 'quantity'
	| 'none';

export interface PantryTilePresentation {
	itemId: string;
	name: string;
	warn: boolean;
	detailKind: PantryTileDetailKind;
	expiresInDays: number | null;
	expiresOn: string | null;
	expiresOnSource: ExpiresOnSource | null;
	quantity: string;
	unit: string | null;
}

export interface PantryZoneShelf {
	location: StorageLocation;
	tiles: PantryTilePresentation[];
	overflowCount: number;
	totalCount: number;
}

export interface PantryShelfViewModel {
	useSoon: InventoryItem[];
	useSoonNames: string[];
	zones: PantryZoneShelf[];
	isEmpty: boolean;
	totalActiveCount: number;
}

export function getActiveInventoryItems(items: InventoryItem[]): InventoryItem[] {
	return items.filter((item) => !isItemFinished(item));
}

export function countMissingExpiry(items: InventoryItem[]): number {
	return getActiveInventoryItems(items).filter((item) => !item.expiresOn).length;
}

export function filterInventoryBySearch(items: InventoryItem[], query: string): InventoryItem[] {
	const normalized = query.trim().toLocaleLowerCase('sv');
	if (!normalized) {
		return items;
	}

	return getActiveInventoryItems(items).filter((item) =>
		item.name.toLocaleLowerCase('sv').includes(normalized)
	);
}

export function groupItemsByZone(
	items: InventoryItem[]
): Record<StorageLocation, InventoryItem[]> {
	const groups = Object.fromEntries(
		LOCATIONS.map((location) => [location, [] as InventoryItem[]])
	) as Record<StorageLocation, InventoryItem[]>;

	for (const item of getActiveInventoryItems(items)) {
		groups[item.location].push(item);
	}

	return groups;
}

export function isUseSoonItem(
	item: InventoryItem,
	daysBefore = USE_SOON_DAYS,
	today = new Date()
): boolean {
	if (!item.expiresOn) {
		return false;
	}

	const daysLeft = daysUntilExpiry(item.expiresOn, today);
	return daysLeft >= 0 && daysLeft <= daysBefore;
}

export function sortZoneItemsForTiles(items: InventoryItem[], today = new Date()): InventoryItem[] {
	return [...items].sort((a, b) => {
		const aWarn = isUseSoonItem(a, USE_SOON_DAYS, today);
		const bWarn = isUseSoonItem(b, USE_SOON_DAYS, today);
		if (aWarn !== bWarn) {
			return aWarn ? -1 : 1;
		}

		if (a.expiresOn && b.expiresOn) {
			const byExpiry = a.expiresOn.localeCompare(b.expiresOn);
			if (byExpiry !== 0) {
				return byExpiry;
			}
		} else if (a.expiresOn) {
			return -1;
		} else if (b.expiresOn) {
			return 1;
		}

		return a.name.localeCompare(b.name, 'sv');
	});
}

export function resolveTileDetail(
	item: InventoryItem,
	today = new Date()
): Pick<PantryTilePresentation, 'detailKind' | 'warn' | 'expiresInDays' | 'expiresOn'> {
	if (item.expiresOn) {
		const daysLeft = daysUntilExpiry(item.expiresOn, today);
		if (daysLeft >= 0 && daysLeft <= USE_SOON_DAYS) {
			return {
				detailKind: daysLeft === 0 ? 'expires_today' : 'expires_days',
				warn: true,
				expiresInDays: daysLeft,
				expiresOn: item.expiresOn
			};
		}

		return {
			detailKind: 'expires_date',
			warn: false,
			expiresInDays: daysLeft,
			expiresOn: item.expiresOn
		};
	}

	return {
		detailKind: 'missing_expiry',
		warn: false,
		expiresInDays: null,
		expiresOn: null
	};
}

export function buildPantryTile(item: InventoryItem, today = new Date()): PantryTilePresentation {
	const detail = resolveTileDetail(item, today);

	return {
		itemId: item.id,
		name: item.name,
		quantity: item.quantity,
		unit: item.unit,
		expiresOnSource: item.expiresOnSource,
		...detail
	};
}

export function buildZoneShelf(
	location: StorageLocation,
	items: InventoryItem[],
	maxTiles = MAX_TILES_PER_ZONE,
	today = new Date()
): PantryZoneShelf {
	const sorted = sortZoneItemsForTiles(items, today);
	const visible = sorted.slice(0, maxTiles);

	return {
		location,
		tiles: visible.map((item) => buildPantryTile(item, today)),
		overflowCount: Math.max(sorted.length - maxTiles, 0),
		totalCount: sorted.length
	};
}

export function buildUseSoonNames(
	items: InventoryItem[],
	max = USE_SOON_LIST_MAX,
	today = new Date()
): string[] {
	return filterItemsExpiringWithinDays(items, USE_SOON_DAYS, today)
		.slice(0, max)
		.map((item) => item.name);
}

export function buildPantryShelfView(
	items: InventoryItem[],
	today = new Date()
): PantryShelfViewModel {
	const active = getActiveInventoryItems(items);
	const grouped = groupItemsByZone(active);
	const useSoon = filterItemsExpiringWithinDays(active, USE_SOON_DAYS, today);

	return {
		useSoon,
		useSoonNames: buildUseSoonNames(active, USE_SOON_LIST_MAX, today),
		zones: LOCATIONS.map((location) => buildZoneShelf(location, grouped[location], MAX_TILES_PER_ZONE, today)),
		isEmpty: active.length === 0,
		totalActiveCount: active.length
	};
}
