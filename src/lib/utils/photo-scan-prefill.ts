export const PHOTO_SCAN_PREFILL_KEY = 'pantry:photo-prefill';

export interface PhotoScanPrefill {
	name: string;
	quantity: string;
	unit: string;
	notes: string;
}

export function savePhotoScanPrefill(prefill: PhotoScanPrefill): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.setItem(PHOTO_SCAN_PREFILL_KEY, JSON.stringify(prefill));
}

export function consumePhotoScanPrefill(): PhotoScanPrefill | null {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}
	const raw = sessionStorage.getItem(PHOTO_SCAN_PREFILL_KEY);
	if (!raw) {
		return null;
	}
	sessionStorage.removeItem(PHOTO_SCAN_PREFILL_KEY);
	try {
		return JSON.parse(raw) as PhotoScanPrefill;
	} catch {
		return null;
	}
}
