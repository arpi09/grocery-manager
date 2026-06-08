import { describe, expect, it } from 'vitest';
import { isStaleItem, stalenessCutoffDate, STALENESS_THRESHOLD_DAYS } from './inventory-staleness';

const now = new Date('2026-06-08T12:00:00Z');

function item(
	overrides: Partial<{
		expiresOn: string | null;
		lastConfirmedAt: Date;
		quantity: string;
	}>
) {
	return {
		expiresOn: overrides.expiresOn ?? null,
		lastConfirmedAt: overrides.lastConfirmedAt ?? now,
		quantity: overrides.quantity ?? '1'
	};
}

describe('inventory staleness', () => {
	it('computes cutoff from threshold days', () => {
		const cutoff = stalenessCutoffDate(75, now);
		expect(cutoff.toISOString()).toBe('2026-03-25T12:00:00.000Z');
	});

	it('flags undated items with old lastConfirmedAt', () => {
		const old = new Date(now.getTime() - (STALENESS_THRESHOLD_DAYS + 1) * 24 * 60 * 60 * 1000);
		expect(isStaleItem(item({ lastConfirmedAt: old }), now)).toBe(true);
	});

	it('ignores items with expiry date', () => {
		const old = new Date('2020-01-01T12:00:00Z');
		expect(isStaleItem(item({ expiresOn: '2026-12-01', lastConfirmedAt: old }), now)).toBe(false);
	});

	it('ignores recently confirmed undated items', () => {
		expect(isStaleItem(item({ lastConfirmedAt: now }), now)).toBe(false);
	});

	it('ignores finished items', () => {
		const old = new Date('2020-01-01T12:00:00Z');
		expect(isStaleItem(item({ lastConfirmedAt: old, quantity: '0' }), now)).toBe(false);
	});
});
