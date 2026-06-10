import { describe, expect, it } from 'vitest';
import {
	createExpiringShareWithGeoSchema,
	updateNearbySharingSettingsSchema
} from './nearby-sharing.schemas';

describe('updateNearbySharingSettingsSchema', () => {
	it('accepts opt-out without coordinates', () => {
		const parsed = updateNearbySharingSettingsSchema.safeParse({ enabled: false });
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data).toEqual({ enabled: false });
		}
	});

	it('accepts opt-in with valid coordinates', () => {
		const parsed = updateNearbySharingSettingsSchema.safeParse({
			enabled: true,
			latitude: 59.329323,
			longitude: 18.068581
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.enabled).toBe(true);
			expect(parsed.data.latitude).toBe(59.329323);
			expect(parsed.data.longitude).toBe(18.068581);
		}
	});

	it('accepts opt-in without coordinates (server may reuse stored location)', () => {
		const parsed = updateNearbySharingSettingsSchema.safeParse({ enabled: true });
		expect(parsed.success).toBe(true);
	});

	it('rejects non-finite coordinates', () => {
		expect(
			updateNearbySharingSettingsSchema.safeParse({
				enabled: true,
				latitude: Number.NaN,
				longitude: 18.0
			}).success
		).toBe(false);
		expect(
			updateNearbySharingSettingsSchema.safeParse({
				enabled: true,
				latitude: 59.3,
				longitude: Number.POSITIVE_INFINITY
			}).success
		).toBe(false);
	});

	it('rejects missing enabled flag', () => {
		expect(updateNearbySharingSettingsSchema.safeParse({}).success).toBe(false);
	});
});

describe('createExpiringShareWithGeoSchema', () => {
	it('accepts empty body', () => {
		const parsed = createExpiringShareWithGeoSchema.safeParse({});
		expect(parsed.success).toBe(true);
	});

	it('accepts attachNearby with coordinates', () => {
		const parsed = createExpiringShareWithGeoSchema.safeParse({
			attachNearby: true,
			latitude: 59.329,
			longitude: 18.069
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.attachNearby).toBe(true);
		}
	});

	it('rejects non-finite coordinates', () => {
		expect(
			createExpiringShareWithGeoSchema.safeParse({
				attachNearby: true,
				latitude: Number.NaN,
				longitude: 18.069
			}).success
		).toBe(false);
	});
});
