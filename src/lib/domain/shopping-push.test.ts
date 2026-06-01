import { describe, expect, it } from 'vitest';
import { shouldSendShoppingPush } from './shopping-push';

describe('shouldSendShoppingPush', () => {
	it('allows first push when never sent', () => {
		expect(shouldSendShoppingPush(null, new Date('2026-06-01T08:00:00Z'))).toBe(true);
	});

	it('blocks second push on the same calendar day', () => {
		const now = new Date('2026-06-01T12:00:00Z');
		const lastSent = new Date('2026-06-01T06:00:00Z');
		expect(shouldSendShoppingPush(lastSent, now)).toBe(false);
	});

	it('allows push on a new calendar day', () => {
		const now = new Date('2026-06-02T06:00:00Z');
		const lastSent = new Date('2026-06-01T18:00:00Z');
		expect(shouldSendShoppingPush(lastSent, now)).toBe(true);
	});
});
