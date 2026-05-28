import type { LocationCount } from '$lib/domain/inventory-item';
import type { StorageLocation } from '$lib/domain/location';

export { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';

export type LocationBar = {
	location: StorageLocation;
	count: number;
	percent: number;
};

export function buildLocationBars(
	counts: LocationCount[],
	totalItems: number
): LocationBar[] {
	return counts.map((entry) => ({
		location: entry.location,
		count: entry.count,
		percent:
			totalItems === 0 ? 0 : Math.round((entry.count / totalItems) * 100)
	}));
}
