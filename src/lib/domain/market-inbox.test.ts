import { describe, expect, it } from 'vitest';
import {
	filterInboxThreadsBySegment,
	formatMarketInboxRelativeTime,
	isActiveInboxThread
} from './market-inbox';

describe('market-inbox', () => {
	it('treats terminal lifecycle threads as closed', () => {
		expect(
			isActiveInboxThread({
				lifecycleStatus: 'completed',
				closedAt: new Date('2026-01-01T10:00:00Z')
			})
		).toBe(false);
		expect(isActiveInboxThread({ lifecycleStatus: 'chatting', closedAt: null })).toBe(true);
	});

	it('filters threads by segment', () => {
		const threads = [
			{ lifecycleStatus: 'chatting' as const, closedAt: null },
			{ lifecycleStatus: 'completed' as const, closedAt: '2026-01-01T10:00:00Z' }
		];

		expect(filterInboxThreadsBySegment(threads, 'active')).toHaveLength(1);
		expect(filterInboxThreadsBySegment(threads, 'closed')).toHaveLength(1);
	});

	it('formats relative time', () => {
		const now = new Date('2026-06-22T12:00:00Z');
		const fiveMinutesAgo = new Date('2026-06-22T11:55:00Z');
		expect(formatMarketInboxRelativeTime(fiveMinutesAgo, 'en', now)).toMatch(/5 minutes ago|5 min/);
	});
});
