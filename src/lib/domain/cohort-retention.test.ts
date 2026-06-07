import { describe, expect, it } from 'vitest';
import {
	buildAdminCohortRetention,
	buildCohortRetentionRows,
	isCohortRetentionEligible,
	isCohortSessionRetained,
	mondayWeekStartUtc
} from './cohort-retention';

describe('cohort retention', () => {
	const now = new Date('2026-06-10T12:00:00.000Z');

	it('maps dates to UTC Monday week starts', () => {
		expect(mondayWeekStartUtc(new Date('2026-06-10T12:00:00.000Z'))).toBe('2026-06-08');
		expect(mondayWeekStartUtc(new Date('2026-06-07T12:00:00.000Z'))).toBe('2026-06-01');
	});

	it('marks users eligible only after the retention window', () => {
		const registeredAt = new Date('2026-06-01T10:00:00.000Z');
		expect(isCohortRetentionEligible(registeredAt, 7, new Date('2026-06-07T23:59:59.000Z'))).toBe(
			false
		);
		expect(isCohortRetentionEligible(registeredAt, 7, new Date('2026-06-08T12:00:00.000Z'))).toBe(
			true
		);
	});

	it('counts session activity on the retention day', () => {
		const registeredAt = new Date('2026-06-01T10:00:00.000Z');
		const sessionDays = new Set(['2026-06-02']);
		expect(isCohortSessionRetained(registeredAt, 1, sessionDays)).toBe(true);
		expect(isCohortSessionRetained(registeredAt, 7, new Set(['2026-06-08']))).toBe(true);
	});

	it('aggregates weekly cohort retention and gates on D30 eligible total', () => {
		const users = [
			{ userId: 'u1', registeredAt: new Date('2026-06-02T10:00:00.000Z') },
			{ userId: 'u2', registeredAt: new Date('2026-06-03T10:00:00.000Z') },
			{ userId: 'u3', registeredAt: new Date('2026-05-01T10:00:00.000Z') }
		];
		const sessionDaysByUser = new Map<string, Set<string>>([
			['u1', new Set(['2026-06-03', '2026-06-09'])],
			['u2', new Set(['2026-06-04'])],
			['u3', new Set(['2026-05-08', '2026-06-01'])]
		]);

		const { weeks, d30EligibleTotal } = buildCohortRetentionRows(
			users,
			sessionDaysByUser,
			now,
			12
		);
		expect(weeks).toHaveLength(2);
		expect(weeks[0]?.weekStart).toBe('2026-04-27');
		expect(weeks[0]?.d7.retained).toBe(1);
		expect(weeks[1]?.weekStart).toBe('2026-06-01');
		expect(weeks[1]?.d1.retained).toBe(2);
		expect(d30EligibleTotal).toBe(1);

		const gated = buildAdminCohortRetention({
			users,
			sessionDaysByUser,
			now,
			minEligible: 30
		});
		expect(gated.gated).toBe(true);
		expect(gated.minEligible).toBe(30);
	});
});
