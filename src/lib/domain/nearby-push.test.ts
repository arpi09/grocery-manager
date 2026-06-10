import { describe, expect, it } from 'vitest';
import {
	formatNearbyPushPreviewBody,
	NEARBY_PUSH_DEBOUNCE_MS,
	shouldSendNearbyPush
} from './nearby-push';

describe('nearby-push domain', () => {
	it('shouldSendNearbyPush allows first send', () => {
		expect(shouldSendNearbyPush(null)).toBe(true);
		expect(shouldSendNearbyPush(undefined)).toBe(true);
	});

	it('shouldSendNearbyPush debounces within 24h', () => {
		const now = new Date('2026-06-10T12:00:00Z');
		const recent = new Date(now.getTime() - NEARBY_PUSH_DEBOUNCE_MS + 60_000);
		expect(shouldSendNearbyPush(recent, now)).toBe(false);
	});

	it('shouldSendNearbyPush allows after 24h', () => {
		const now = new Date('2026-06-10T12:00:00Z');
		const old = new Date(now.getTime() - NEARBY_PUSH_DEBOUNCE_MS);
		expect(shouldSendNearbyPush(old, now)).toBe(true);
	});

	it('formatNearbyPushPreviewBody lists up to three names', () => {
		expect(
			formatNearbyPushPreviewBody([{ name: 'Yoghurt' }, { name: 'Mjölk' }, { name: 'Ost' }])
		).toBe('Yoghurt, Mjölk, Ost');
	});

	it('formatNearbyPushPreviewBody adds overflow suffix', () => {
		expect(
			formatNearbyPushPreviewBody(
				[{ name: 'Yoghurt' }, { name: 'Mjölk' }, { name: 'Ost' }, { name: 'Bröd' }],
				(count) => `(+${count} fler)`
			)
		).toBe('Yoghurt, Mjölk (+2 fler)');
	});
});
