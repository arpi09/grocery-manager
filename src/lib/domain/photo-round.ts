import type { StorageLocation } from '$lib/domain/location';

export type PhotoRoundConfidence = 'high' | 'medium' | 'low';

export interface PhotoRoundDetectedItem {
	name: string;
	quantity: string;
	unit: string | null;
	confidence: PhotoRoundConfidence;
	location: StorageLocation;
}

export const PHOTO_ROUND_MAX_IMAGES = 3;
export const PHOTO_ROUND_MAX_IMAGE_BYTES = 6 * 1024 * 1024;
/** Max combined upload size for one analyze request (matches prod BODY_SIZE_LIMIT headroom). */
export const PHOTO_ROUND_MAX_TOTAL_BYTES = PHOTO_ROUND_MAX_IMAGES * PHOTO_ROUND_MAX_IMAGE_BYTES;
