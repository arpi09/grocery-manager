import { describe, expect, it } from 'vitest';
import {
	bothPartiesMarkedExchangeComplete,
	hasUserMarkedExchangeComplete,
	isExchangeReadyForRating,
	isThreadUnreadForUser,
	marketThreadRoleForUser
} from './market-exchange';

const baseThread = {
	seekerUserId: 'seeker',
	sharerUserId: 'sharer',
	exchangeStatus: 'ongoing' as const,
	lifecycleStatus: 'chatting' as const,
	pickupAgreedAt: null,
	seekerCompletedAt: null,
	sharerCompletedAt: null,
	closedAt: null,
	seekerLastReadAt: null,
	sharerLastReadAt: null
};

describe('market-exchange domain', () => {
	it('resolves participant role', () => {
		expect(marketThreadRoleForUser(baseThread, 'seeker')).toBe('seeker');
		expect(marketThreadRoleForUser(baseThread, 'outsider')).toBeNull();
	});

	it('tracks per-party exchange completion', () => {
		const partial = { ...baseThread, seekerCompletedAt: new Date() };
		expect(hasUserMarkedExchangeComplete(partial, 'seeker')).toBe(true);
		expect(hasUserMarkedExchangeComplete(partial, 'sharer')).toBe(false);
		expect(bothPartiesMarkedExchangeComplete(partial)).toBe(false);

		const complete = { ...partial, sharerCompletedAt: new Date() };
		expect(bothPartiesMarkedExchangeComplete(complete)).toBe(true);
		expect(isExchangeReadyForRating(complete)).toBe(true);
	});

	it('detects unread messages from counterpart', () => {
		const message = { authorUserId: 'sharer', createdAt: new Date('2026-06-22T12:00:00Z') };
		expect(isThreadUnreadForUser(baseThread, 'seeker', message)).toBe(true);
		expect(isThreadUnreadForUser(baseThread, 'sharer', message)).toBe(false);

		const read = {
			...baseThread,
			seekerLastReadAt: new Date('2026-06-22T13:00:00Z')
		};
		expect(isThreadUnreadForUser(read, 'seeker', message)).toBe(false);
	});
});
