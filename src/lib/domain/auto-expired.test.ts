import { describe, expect, it } from 'vitest';
import {
	autoExpiredCutoffDate,
	DEFAULT_AUTO_EXPIRED_GRACE_DAYS,
	isAutoExpired,
	normalizeAutoExpiredGraceDays,
	subtractDaysIso
} from './auto-expired';

describe('auto-expired domain', () => {
	const today = new Date(2026, 5, 2);

	it('normalizes grace days to allowed options', () => {
		expect(normalizeAutoExpiredGraceDays(3)).toBe(3);
		expect(normalizeAutoExpiredGraceDays(99)).toBe(DEFAULT_AUTO_EXPIRED_GRACE_DAYS);
	});

	it('computes cutoff from grace period', () => {
		expect(autoExpiredCutoffDate(7, today)).toBe('2026-05-26');
	});

	it('subtracts days from iso date', () => {
		expect(subtractDaysIso('2026-06-01', 3)).toBe('2026-05-29');
	});

	it('detects auto-expired active items', () => {
		expect(
			isAutoExpired({ expiresOn: '2026-05-20', quantity: '1' }, 7, today)
		).toBe(true);
		expect(
			isAutoExpired({ expiresOn: '2026-06-01', quantity: '1' }, 7, today)
		).toBe(false);
		expect(isAutoExpired({ expiresOn: null, quantity: '1' }, 7, today)).toBe(false);
		expect(isAutoExpired({ expiresOn: '2026-05-20', quantity: '0' }, 7, today)).toBe(
			false
		);
	});
});
