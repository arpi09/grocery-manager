import { describe, expect, it } from 'vitest';
import {
	AVATAR_CROP_MAX_ZOOM,
	AVATAR_CROP_MIN_ZOOM,
	clampAvatarCropParams,
	defaultAvatarCropParams
} from './crop-image';

describe('defaultAvatarCropParams', () => {
	it('starts centered at minimum zoom', () => {
		expect(defaultAvatarCropParams()).toEqual({
			offsetX: 0,
			offsetY: 0,
			zoom: 1
		});
	});
});

describe('clampAvatarCropParams', () => {
	const cropSize = 280;

	it('clamps zoom to allowed range', () => {
		expect(
			clampAvatarCropParams(1000, 1000, cropSize, {
				offsetX: 0,
				offsetY: 0,
				zoom: 0.5
			}).zoom
		).toBe(AVATAR_CROP_MIN_ZOOM);

		expect(
			clampAvatarCropParams(1000, 1000, cropSize, {
				offsetX: 0,
				offsetY: 0,
				zoom: 5
			}).zoom
		).toBe(AVATAR_CROP_MAX_ZOOM);
	});

	it('keeps offsets within the visible crop area', () => {
		const clamped = clampAvatarCropParams(400, 800, cropSize, {
			offsetX: 500,
			offsetY: -500,
			zoom: 1
		});

		expect(Math.abs(clamped.offsetX)).toBeLessThanOrEqual(250);
		expect(Math.abs(clamped.offsetY)).toBeLessThanOrEqual(250);
	});
});
