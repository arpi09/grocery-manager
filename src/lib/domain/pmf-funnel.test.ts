import { describe, expect, it } from 'vitest';
import {
	buildActiveDaysByUser,
	buildPmfFunnelConversionRates,
	buildPmfFunnelSnapshot,
	computeD1Retention,
	funnelRate,
	isD1Eligible,
	isD1Retained,
	nextCalendarDayUtc
} from './pmf-funnel';

describe('pmf-funnel D1', () => {
	it('requires activity on signup day and the next calendar day (UTC)', () => {
		const registeredAt = new Date('2026-01-01T22:00:00Z');
		expect(
			isD1Retained(registeredAt, new Set(['2026-01-01', '2026-01-02']))
		).toBe(true);
		expect(isD1Retained(registeredAt, new Set(['2026-01-01']))).toBe(false);
		expect(isD1Retained(registeredAt, new Set(['2026-01-02']))).toBe(false);
	});

	it('marks users eligible only after day+1 has fully passed', () => {
		const registeredAt = new Date('2026-01-01T10:00:00Z');
		expect(isD1Eligible(registeredAt, new Date('2026-01-02T23:59:00Z'))).toBe(false);
		expect(isD1Eligible(registeredAt, new Date('2026-01-03T00:00:00Z'))).toBe(true);
	});

	it('computes retention among eligible cohort', () => {
		const now = new Date('2026-01-10T12:00:00Z');
		const users = [
			{ userId: 'u1', registeredAt: new Date('2026-01-01T10:00:00Z') },
			{ userId: 'u2', registeredAt: new Date('2026-01-02T10:00:00Z') },
			{ userId: 'u3', registeredAt: new Date('2026-01-09T10:00:00Z') }
		];
		const activeDaysByUser = buildActiveDaysByUser([
			{ userId: 'u1', createdAt: new Date('2026-01-01T11:00:00Z') },
			{ userId: 'u1', createdAt: new Date('2026-01-02T11:00:00Z') },
			{ userId: 'u2', createdAt: new Date('2026-01-02T12:00:00Z') }
		]);

		const result = computeD1Retention(users, activeDaysByUser, now);
		expect(result.eligibleUsers).toBe(2);
		expect(result.retainedUsers).toBe(1);
		expect(result.rate).toBe(0.5);
	});

	it('advances calendar days in UTC', () => {
		expect(nextCalendarDayUtc('2026-01-31')).toBe('2026-02-01');
	});
});

describe('buildPmfFunnelSnapshot', () => {
	it('prefers landing_view counts over proxy', () => {
		const snapshot = buildPmfFunnelSnapshot({
			periodDays: 7,
			periodStart: new Date('2026-01-01'),
			periodEnd: new Date('2026-01-08'),
			landingViews: 100,
			uniqueActiveUsersInPeriod: 5,
			signups: 10,
			firstScans: 4,
			users: [],
			activityRows: []
		});

		expect(snapshot.visits).toBe(100);
		expect(snapshot.visitsSource).toBe('landing_view');
	});

	it('falls back to unique active users when no landing views', () => {
		const snapshot = buildPmfFunnelSnapshot({
			periodDays: 7,
			periodStart: new Date('2026-01-01'),
			periodEnd: new Date('2026-01-08'),
			landingViews: 0,
			uniqueActiveUsersInPeriod: 12,
			signups: 3,
			firstScans: 1,
			users: [],
			activityRows: []
		});

		expect(snapshot.visits).toBe(12);
		expect(snapshot.visitsSource).toBe('unique_active_users_proxy');
	});
});

describe('funnelRate', () => {
	it('returns null when denominator is zero', () => {
		expect(funnelRate(1, 0)).toBeNull();
	});
});

describe('buildPmfFunnelConversionRates', () => {
	it('derives step conversion rates from snapshot counts', () => {
		const snapshot = buildPmfFunnelSnapshot({
			periodDays: 7,
			periodStart: new Date('2026-01-01'),
			periodEnd: new Date('2026-01-08'),
			landingViews: 100,
			uniqueActiveUsersInPeriod: 0,
			signups: 20,
			firstScans: 10,
			users: [
				{ userId: 'u1', registeredAt: new Date('2026-01-01T10:00:00Z') },
				{ userId: 'u2', registeredAt: new Date('2026-01-02T10:00:00Z') }
			],
			activityRows: [
				{ userId: 'u1', createdAt: new Date('2026-01-01T11:00:00Z') },
				{ userId: 'u1', createdAt: new Date('2026-01-02T11:00:00Z') }
			]
		});

		const rates = buildPmfFunnelConversionRates(snapshot);

		expect(rates.signupFromVisits).toBe(0.2);
		expect(rates.firstScanFromSignups).toBe(0.5);
		expect(rates.d1FromEligible).toBe(0.5);
	});
});
