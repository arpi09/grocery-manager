import { describe, expect, it } from 'vitest';
import {
	PHOTO_ROUND_PREP_MAX_DIMENSION,
	PHOTO_ROUND_PREP_MAX_INPUT_BYTES,
	PHOTO_ROUND_PREP_MAX_OUTPUT_BYTES,
	PHOTO_ROUND_PREP_JPEG_QUALITY
} from './resize-photo-round-image';
import { computeTargetDimensions } from './resize-image';

describe('photo-round image prep limits', () => {
	it('targets 1920px longest edge for label readability', () => {
		expect(PHOTO_ROUND_PREP_MAX_DIMENSION).toBe(1920);
	});

	it('allows large phone photos before client prep', () => {
		expect(PHOTO_ROUND_PREP_MAX_INPUT_BYTES).toBe(15 * 1024 * 1024);
	});

	it('targets ~2 MB per JPEG after resize', () => {
		expect(PHOTO_ROUND_PREP_MAX_OUTPUT_BYTES).toBe(2 * 1024 * 1024);
	});

	it('uses high JPEG quality for expiry labels', () => {
		expect(PHOTO_ROUND_PREP_JPEG_QUALITY).toBeGreaterThanOrEqual(0.85);
	});
});

describe('photo-round target dimensions', () => {
	it('keeps photos within max dimension', () => {
		expect(computeTargetDimensions(4032, 3024, PHOTO_ROUND_PREP_MAX_DIMENSION)).toEqual({
			width: 1920,
			height: 1440
		});
	});

	it('does not upscale small images', () => {
		expect(computeTargetDimensions(1280, 960, PHOTO_ROUND_PREP_MAX_DIMENSION)).toEqual({
			width: 1280,
			height: 960
		});
	});
});
