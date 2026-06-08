import { describe, expect, it } from 'vitest';
import { computeSyncHealthLevel } from './sync-health';

describe('computeSyncHealthLevel', () => {
	it('returns good when empty pantry', () => {
		expect(
			computeSyncHealthLevel({
				totalItems: 0,
				withoutExpiryCount: 0,
				staleCount: 0
			})
		).toBe('good');
	});

	it('returns needs_love when stale exists', () => {
		expect(
			computeSyncHealthLevel({
				totalItems: 10,
				withoutExpiryCount: 0,
				staleCount: 1
			})
		).toBe('needs_love');
	});

	it('returns needs_love when without expiry ratio over threshold', () => {
		expect(
			computeSyncHealthLevel({
				totalItems: 10,
				withoutExpiryCount: 4,
				staleCount: 0
			})
		).toBe('needs_love');
	});

	it('returns good for healthy baseline', () => {
		expect(
			computeSyncHealthLevel({
				totalItems: 10,
				withoutExpiryCount: 2,
				staleCount: 0
			})
		).toBe('good');
	});
});
