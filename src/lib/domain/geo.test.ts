import { describe, expect, it } from 'vitest';
import {
	coarseGeoCoordinate,
	distanceMetres,
	DISPLAY_JITTER_RADIUS_M,
	geoBoundingBox,
	hashIdToUnitFloat,
	isValidLatitude,
	isValidLongitude,
	jitterCoordinateForDisplay,
	NEARBY_SHARING_RADIUS_M
} from './geo';

describe('geo', () => {
	it('coarsens coordinates to three decimals', () => {
		expect(coarseGeoCoordinate({ latitude: 59.329323, longitude: 18.068581 })).toEqual({
			latitude: 59.329,
			longitude: 18.069
		});
	});

	it('computes short distances accurately enough for 500 m radius', () => {
		const origin = { latitude: 59.329, longitude: 18.069 };
		const nearby = { latitude: 59.332, longitude: 18.072 };
		const metres = distanceMetres(origin, nearby);
		expect(metres).toBeGreaterThan(300);
		expect(metres).toBeLessThan(NEARBY_SHARING_RADIUS_M);
	});

	it('bounding box contains points within radius', () => {
		const center = { latitude: 59.33, longitude: 18.07 };
		const box = geoBoundingBox(center, NEARBY_SHARING_RADIUS_M);
		expect(center.latitude).toBeGreaterThanOrEqual(box.minLat);
		expect(center.latitude).toBeLessThanOrEqual(box.maxLat);
		expect(center.longitude).toBeGreaterThanOrEqual(box.minLng);
		expect(center.longitude).toBeLessThanOrEqual(box.maxLng);
	});

	it('validates latitude and longitude', () => {
		expect(isValidLatitude(59.3)).toBe(true);
		expect(isValidLatitude(91)).toBe(false);
		expect(isValidLongitude(18.0)).toBe(true);
		expect(isValidLongitude(-181)).toBe(false);
	});

	it('hashIdToUnitFloat is deterministic and within [0, 1)', () => {
		const first = hashIdToUnitFloat('share-1', 'angle');
		const second = hashIdToUnitFloat('share-1', 'angle');
		expect(first).toBe(second);
		expect(first).toBeGreaterThanOrEqual(0);
		expect(first).toBeLessThan(1);
	});

	it('jitterCoordinateForDisplay offsets coarse coords without exposing exact point', () => {
		const coarse = { latitude: 59.329, longitude: 18.069 };
		const jittered = jitterCoordinateForDisplay('share-abc', coarse);
		expect(jittered.latitude).not.toBe(coarse.latitude);
		expect(jittered.longitude).not.toBe(coarse.longitude);
		const distance = distanceMetres(coarse, jittered);
		expect(distance).toBeGreaterThan(0);
		expect(distance).toBeLessThanOrEqual(DISPLAY_JITTER_RADIUS_M + 5);
		expect(jitterCoordinateForDisplay('share-abc', coarse)).toEqual(jittered);
	});
});
