export const COHORT_RETENTION_MIN_ELIGIBLE_D30 = 30;
export const COHORT_RETENTION_WEEK_LOOKBACK = 12;

export const COHORT_RETENTION_DAY_OFFSETS = [1, 7, 30] as const;
export type CohortRetentionDayOffset = (typeof COHORT_RETENTION_DAY_OFFSETS)[number];

export interface CohortSignupUser {
	userId: string;
	registeredAt: Date;
}

export interface CohortRetentionMetric {
	rate: number;
	eligible: number;
	retained: number;
}

export interface CohortRetentionWeekRow {
	weekStart: string;
	signups: number;
	d1: CohortRetentionMetric;
	d7: CohortRetentionMetric;
	d30: CohortRetentionMetric;
}

export interface AdminCohortRetention {
	weeks: CohortRetentionWeekRow[];
	d30EligibleTotal: number;
	gated: boolean;
	minEligible: number;
}

/** UTC Monday (YYYY-MM-DD) for the calendar week containing `date`. */
export function mondayWeekStartUtc(date: Date): string {
	const anchor = new Date(date);
	anchor.setUTCHours(0, 0, 0, 0);
	const weekday = anchor.getUTCDay();
	const diff = weekday === 0 ? -6 : 1 - weekday;
	anchor.setUTCDate(anchor.getUTCDate() + diff);
	return anchor.toISOString().slice(0, 10);
}

export function calendarDayUtc(value: Date): string {
	return value.toISOString().slice(0, 10);
}

export function isCohortRetentionEligible(
	registeredAt: Date,
	dayOffset: CohortRetentionDayOffset,
	now: Date
): boolean {
	const eligibleAfter = new Date(registeredAt);
	eligibleAfter.setUTCDate(eligibleAfter.getUTCDate() + dayOffset);
	return now >= eligibleAfter;
}

export function isCohortSessionRetained(
	registeredAt: Date,
	dayOffset: CohortRetentionDayOffset,
	sessionDays: Set<string> | undefined
): boolean {
	if (!sessionDays || sessionDays.size === 0) {
		return false;
	}
	const returnDay = new Date(registeredAt);
	returnDay.setUTCDate(returnDay.getUTCDate() + dayOffset);
	return sessionDays.has(calendarDayUtc(returnDay));
}

function emptyMetric(): CohortRetentionMetric {
	return { rate: 0, eligible: 0, retained: 0 };
}

function computeMetric(
	users: CohortSignupUser[],
	dayOffset: CohortRetentionDayOffset,
	sessionDaysByUser: Map<string, Set<string>>,
	now: Date
): CohortRetentionMetric {
	const eligibleUsers = users.filter((user) =>
		isCohortRetentionEligible(user.registeredAt, dayOffset, now)
	);
	if (eligibleUsers.length === 0) {
		return emptyMetric();
	}

	let retained = 0;
	for (const user of eligibleUsers) {
		if (isCohortSessionRetained(user.registeredAt, dayOffset, sessionDaysByUser.get(user.userId))) {
			retained++;
		}
	}

	return {
		rate: retained / eligibleUsers.length,
		eligible: eligibleUsers.length,
		retained
	};
}

export function buildCohortRetentionRows(
	users: CohortSignupUser[],
	sessionDaysByUser: Map<string, Set<string>>,
	now: Date,
	lookbackWeeks = COHORT_RETENTION_WEEK_LOOKBACK
): { weeks: CohortRetentionWeekRow[]; d30EligibleTotal: number } {
	const cutoff = new Date(now);
	cutoff.setUTCHours(0, 0, 0, 0);
	cutoff.setUTCDate(cutoff.getUTCDate() - lookbackWeeks * 7);

	const byWeek = new Map<string, CohortSignupUser[]>();
	for (const user of users) {
		if (user.registeredAt < cutoff) {
			continue;
		}
		const weekStart = mondayWeekStartUtc(user.registeredAt);
		const bucket = byWeek.get(weekStart) ?? [];
		bucket.push(user);
		byWeek.set(weekStart, bucket);
	}

	const weeks = [...byWeek.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([weekStart, cohortUsers]) => ({
			weekStart,
			signups: cohortUsers.length,
			d1: computeMetric(cohortUsers, 1, sessionDaysByUser, now),
			d7: computeMetric(cohortUsers, 7, sessionDaysByUser, now),
			d30: computeMetric(cohortUsers, 30, sessionDaysByUser, now)
		}));

	const d30EligibleTotal = weeks.reduce((sum, week) => sum + week.d30.eligible, 0);
	return { weeks, d30EligibleTotal };
}

export function buildAdminCohortRetention(input: {
	users: CohortSignupUser[];
	sessionDaysByUser: Map<string, Set<string>>;
	now?: Date;
	lookbackWeeks?: number;
	minEligible?: number;
}): AdminCohortRetention {
	const now = input.now ?? new Date();
	const minEligible = input.minEligible ?? COHORT_RETENTION_MIN_ELIGIBLE_D30;
	const { weeks, d30EligibleTotal } = buildCohortRetentionRows(
		input.users,
		input.sessionDaysByUser,
		now,
		input.lookbackWeeks
	);

	return {
		weeks,
		d30EligibleTotal,
		gated: d30EligibleTotal < minEligible,
		minEligible
	};
}
