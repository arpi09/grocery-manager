import { describe, expect, it } from 'vitest';
import { PHOTO_ROUND_MAX_IMAGES } from '$lib/domain/photo-round';
import { isPhotoRoundZone, parsePhotoRoundZoneHint } from '$lib/server/photo-round-parse';

describe('photo-scan API validation helpers', () => {
	it('accepts storage locations as zones', () => {
		expect(isPhotoRoundZone('fridge')).toBe(true);
		expect(isPhotoRoundZone('freezer')).toBe(true);
		expect(isPhotoRoundZone('cupboard')).toBe(true);
	});

	it('rejects invalid zones', () => {
		expect(isPhotoRoundZone('pantry')).toBe(false);
		expect(isPhotoRoundZone('')).toBe(false);
	});

	it('treats auto zone as no hint', () => {
		expect(parsePhotoRoundZoneHint('auto')).toBeNull();
		expect(parsePhotoRoundZoneHint('fridge')).toBe('fridge');
	});

	it('caps images at three', () => {
		expect(PHOTO_ROUND_MAX_IMAGES).toBe(3);
	});
});
