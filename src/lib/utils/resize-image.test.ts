import { describe, expect, it } from 'vitest';
import {
	AVATAR_MAX_DIMENSION,
	AVATAR_MAX_INPUT_BYTES,
	AVATAR_MAX_OUTPUT_BYTES,
	computeTargetDimensions,
	isAcceptedAvatarMimeType
} from './resize-image';

describe('computeTargetDimensions', () => {
	it('keeps dimensions when both edges are within the max', () => {
		expect(computeTargetDimensions(800, 600)).toEqual({ width: 800, height: 600 });
		expect(computeTargetDimensions(1024, 768)).toEqual({ width: 1024, height: 768 });
	});

	it('scales down portrait photos by longest edge', () => {
		expect(computeTargetDimensions(3024, 4032, AVATAR_MAX_DIMENSION)).toEqual({
			width: 768,
			height: 1024
		});
	});

	it('scales down landscape photos by longest edge', () => {
		expect(computeTargetDimensions(4032, 3024, AVATAR_MAX_DIMENSION)).toEqual({
			width: 1024,
			height: 768
		});
	});

	it('scales square images to the max edge', () => {
		expect(computeTargetDimensions(2000, 2000, AVATAR_MAX_DIMENSION)).toEqual({
			width: 1024,
			height: 1024
		});
	});

	it('returns zero dimensions for invalid input', () => {
		expect(computeTargetDimensions(0, 100)).toEqual({ width: 0, height: 0 });
		expect(computeTargetDimensions(100, -1)).toEqual({ width: 0, height: 0 });
	});
});

describe('isAcceptedAvatarMimeType', () => {
	it('accepts common avatar formats', () => {
		expect(isAcceptedAvatarMimeType('image/jpeg')).toBe(true);
		expect(isAcceptedAvatarMimeType('image/png')).toBe(true);
		expect(isAcceptedAvatarMimeType('image/webp')).toBe(true);
		expect(isAcceptedAvatarMimeType('image/heic')).toBe(true);
		expect(isAcceptedAvatarMimeType('image/heif')).toBe(true);
	});

	it('rejects unsupported formats', () => {
		expect(isAcceptedAvatarMimeType('image/gif')).toBe(false);
		expect(isAcceptedAvatarMimeType('application/pdf')).toBe(false);
		expect(isAcceptedAvatarMimeType('')).toBe(false);
	});
});

describe('avatar limits', () => {
	it('allows multi-megabyte phone photos before resize', () => {
		expect(AVATAR_MAX_INPUT_BYTES).toBe(5 * 1024 * 1024);
	});

	it('targets sub-500KB output after resize', () => {
		expect(AVATAR_MAX_OUTPUT_BYTES).toBe(500 * 1024);
	});
});
