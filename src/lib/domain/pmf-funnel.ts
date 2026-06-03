import type { ProductEventType } from '$lib/domain/pmf';

export const PMF_FUNNEL_PERIOD_OPTIONS = [7, 30] as const;
export type PmfFunnelPeriodDays = (typeof PMF_FUNNEL_PERIOD_OPTIONS)[number];

export const PMF_FUNNEL_PERIOD_DAYS: PmfFunnelPeriodDays = 7;

/** Scan-like events used for first-scan and D1 activity (product_event). */
export const FUNNEL_ACTIVITY_EVENT_TYPES = [
	'scan_completed',
	'receipt_parsed',
	'photo_round_parsed',
	'first_scan',
	'signup_complete',
	'fill_suggestions_added',
	'onboarding_skipped',
	'onboarding_quickstart'
] as const satisfies readonly ProductEventType[];

export const FUNNEL_FIRST_SCAN_EVENT_TYPES = [
	'first_scan',
	'scan_completed',
	'receipt_parsed',
	'photo_round_parsed'
] as const satisfies readonly ProductEventType[];

export type PmfFunnelVisitsSource = 'landing_view' | 'unique_active_users_proxy';

export interface PmfFunnelUserRow {
	userId: string;
	registeredAt: Date;
}

export interface PmfFunnelActivityRow {
	userId: string;
	createdAt: Date;
}

export interface PmfFunnelSnapshot {
	periodDays: PmfFunnelPeriodDays;
	periodStart: Date;
	periodEnd: Date;
	visits: number;
	visitsSource: PmfFunnelVisitsSource;
	signups: number;
	firstScans: number;
	d1Retention: number;
	d1EligibleUsers: number;
	d1RetainedUsers: number;
}

export function parsePmfFunnelPeriodDays(
	raw: string | number | null | undefined
): PmfFunnelPeriodDays {
	const parsed = Number(raw ?? PMF_FUNNEL_PERIOD_DAYS);
	return parsed === 30 ? 30 : 7;
}

/** UTC calendar day (YYYY-MM-DD) for retention cohorts. */
export function calendarDayUtc(value: Date): string {
	return value.toISOString().slice(0, 10);
}

export function nextCalendarDayUtc(day: string): string {
	const anchor = new Date(`${day}T12:00:00.000Z`);
	anchor.setUTCDate(anchor.getUTCDate() + 1);
	return calendarDayUtc(anchor);
}

/**
 * D1 cohort: signup calendar day and the following day have both elapsed (UTC).
 * Retained users must have product_event activity on signup day AND day+1.
 */
export function isD1Eligible(registeredAt: Date, now: Date): boolean {
	const signupDay = calendarDayUtc(registeredAt);
	const dayAfterSignup = nextCalendarDayUtc(signupDay);
	return calendarDayUtc(now) > dayAfterSignup;
}

export function buildActiveDaysByUser(rows: PmfFunnelActivityRow[]): Map<string, Set<string>> {
	const byUser = new Map<string, Set<string>>();

	for (const row of rows) {
		const day = calendarDayUtc(row.createdAt);
		const days = byUser.get(row.userId) ?? new Set<string>();
		days.add(day);
		byUser.set(row.userId, days);
	}

	return byUser;
}

export function isD1Retained(
	registeredAt: Date,
	activeDays: Set<string> | undefined
): boolean {
	if (!activeDays || activeDays.size === 0) {
		return false;
	}

	const signupDay = calendarDayUtc(registeredAt);
	const nextDay = nextCalendarDayUtc(signupDay);
	return activeDays.has(signupDay) && activeDays.has(nextDay);
}

export function computeD1Retention(
	users: PmfFunnelUserRow[],
	activeDaysByUser: Map<string, Set<string>>,
	now: Date
): { rate: number; eligibleUsers: number; retainedUsers: number } {
	const eligible = users.filter((user) => isD1Eligible(user.registeredAt, now));

	if (eligible.length === 0) {
		return { rate: 0, eligibleUsers: 0, retainedUsers: 0 };
	}

	let retainedUsers = 0;
	for (const user of eligible) {
		if (isD1Retained(user.registeredAt, activeDaysByUser.get(user.userId))) {
			retainedUsers++;
		}
	}

	return {
		rate: retainedUsers / eligible.length,
		eligibleUsers: eligible.length,
		retainedUsers
	};
}

export function funnelRate(numerator: number, denominator: number): number | null {
	if (denominator === 0) {
		return null;
	}
	return numerator / denominator;
}

export interface PmfFunnelConversionRates {
	signupFromVisits: number | null;
	firstScanFromSignups: number | null;
	d1FromEligible: number | null;
}

export function buildPmfFunnelConversionRates(snapshot: PmfFunnelSnapshot): PmfFunnelConversionRates {
	return {
		signupFromVisits: funnelRate(snapshot.signups, snapshot.visits),
		firstScanFromSignups: funnelRate(snapshot.firstScans, snapshot.signups),
		d1FromEligible: funnelRate(snapshot.d1RetainedUsers, snapshot.d1EligibleUsers)
	};
}

export function buildPmfFunnelSnapshot(input: {
	periodDays: PmfFunnelPeriodDays;
	periodStart: Date;
	periodEnd: Date;
	landingViews: number;
	uniqueActiveUsersInPeriod: number;
	signups: number;
	firstScans: number;
	users: PmfFunnelUserRow[];
	activityRows: PmfFunnelActivityRow[];
}): PmfFunnelSnapshot {
	const visitsSource: PmfFunnelVisitsSource =
		input.landingViews > 0 ? 'landing_view' : 'unique_active_users_proxy';
	const visits =
		visitsSource === 'landing_view' ? input.landingViews : input.uniqueActiveUsersInPeriod;

	const d1 = computeD1Retention(input.users, buildActiveDaysByUser(input.activityRows), input.periodEnd);

	return {
		periodDays: input.periodDays,
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		visits,
		visitsSource,
		signups: input.signups,
		firstScans: input.firstScans,
		d1Retention: d1.rate,
		d1EligibleUsers: d1.eligibleUsers,
		d1RetainedUsers: d1.retainedUsers
	};
}
