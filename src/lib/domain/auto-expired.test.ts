import { describe, expect, it } from 'vitest';
import {
	addDaysIso,
	autoExpiredCutoffDate,
	daysUntilAutoExpiredMove,
	DEFAULT_AUTO_EXPIRED_GRACE_DAYS,
	isAutoExpired,
	isMovingToAutoExpiredSoon,
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
		const base = { quantity: '1' as const, location: 'fridge' as const, expiresOnSource: 'user_set' as const };
		expect(
			isAutoExpired({ ...base, expiresOn: '2026-05-20' }, 7, today)
		).toBe(true);
		expect(
			isAutoExpired({ ...base, expiresOn: '2026-06-01' }, 7, today)
		).toBe(false);
		expect(isAutoExpired({ ...base, expiresOn: null }, 7, today)).toBe(false);
		expect(isAutoExpired({ ...base, expiresOn: '2026-05-20', quantity: '0' }, 7, today)).toBe(
			false
		);
	});

	it('adds days to iso date', () => {
		expect(addDaysIso('2026-06-01', 7)).toBe('2026-06-08');
	});

	it('computes days until auto-expired move', () => {
		expect(daysUntilAutoExpiredMove('2026-05-28', 7, today)).toBe(2);
		expect(daysUntilAutoExpiredMove('2026-05-29', 7, today)).toBe(3);
	});

	it('flags items moving to auto-expired within 2–3 days', () => {
		const base = { quantity: '1' as const, location: 'fridge' as const, expiresOnSource: 'user_set' as const };
		expect(
			isMovingToAutoExpiredSoon({ ...base, expiresOn: '2026-05-28' }, 7, today)
		).toBe(true);
		expect(
			isMovingToAutoExpiredSoon({ ...base, expiresOn: '2026-05-29' }, 7, today)
		).toBe(true);
		expect(
			isMovingToAutoExpiredSoon({ ...base, expiresOn: '2026-06-01' }, 7, today)
		).toBe(false);
		expect(
			isMovingToAutoExpiredSoon({ ...base, expiresOn: '2026-05-20' }, 7, today)
		).toBe(false);
	});

	it('uses shorter grace for default_heuristic sources', () => {
		const uncertain = {
			expiresOn: '2026-05-27',
			quantity: '1' as const,
			location: 'fridge' as const,
			expiresOnSource: 'default_heuristic' as const
		};
		const trusted = {
			...uncertain,
			expiresOnSource: 'user_set' as const
		};
		expect(isAutoExpired(uncertain, 7, today)).toBe(true);
		expect(isAutoExpired(trusted, 7, today)).toBe(false);
	});
});
