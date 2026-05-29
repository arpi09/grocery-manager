import { describe, expect, it } from 'vitest';
import { latestLastSeenAt } from './admin-stats';

describe('latestLastSeenAt', () => {
	it('returns null when no users have been seen', () => {
		expect(latestLastSeenAt([{ lastSeenAt: null }, { lastSeenAt: null }])).toBeNull();
	});

	it('returns the most recent timestamp', () => {
		const older = new Date('2026-05-01T10:00:00Z');
		const newer = new Date('2026-05-28T12:00:00Z');

		expect(
			latestLastSeenAt([
				{ lastSeenAt: older },
				{ lastSeenAt: null },
				{ lastSeenAt: newer }
			])
		).toEqual(newer);
	});
});
