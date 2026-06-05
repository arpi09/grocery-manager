import { describe, expect, it } from 'vitest';
import {
	PHOTO_ROUND_MAX_IMAGE_BYTES,
	PHOTO_ROUND_MAX_IMAGES,
	PHOTO_ROUND_MAX_TOTAL_BYTES
} from './photo-round';

describe('photo-round limits', () => {
	it('allows up to three images per analysis', () => {
		expect(PHOTO_ROUND_MAX_IMAGES).toBe(3);
	});

	it('limits each image to 6 MB', () => {
		expect(PHOTO_ROUND_MAX_IMAGE_BYTES).toBe(6 * 1024 * 1024);
	});

	it('total upload cap equals per-image limit times max images', () => {
		expect(PHOTO_ROUND_MAX_TOTAL_BYTES).toBe(
			PHOTO_ROUND_MAX_IMAGES * PHOTO_ROUND_MAX_IMAGE_BYTES
		);
	});
});
