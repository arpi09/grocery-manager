import { isStorageLocation, type StorageLocation } from '$lib/domain/location';

export const RECEIPT_BULK_LOCATION_KEY = 'home-pantry-receipt-bulk-location';

export function readReceiptBulkLocation(): StorageLocation | null {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}
	const stored = sessionStorage.getItem(RECEIPT_BULK_LOCATION_KEY);
	return stored && isStorageLocation(stored) ? stored : null;
}

export function writeReceiptBulkLocation(location: StorageLocation): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.setItem(RECEIPT_BULK_LOCATION_KEY, location);
}
