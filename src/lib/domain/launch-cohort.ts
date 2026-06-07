import type { PmfFunnelPeriodDays } from '$lib/domain/pmf-funnel';

/** Shown when signup_complete has no utm_campaign in metadata. */
export const LAUNCH_COHORT_UNKNOWN_CAMPAIGN = '(none)';

export interface LaunchCohortSignupRow {
	weekStart: Date;
	utmCampaign: string;
	signups: number;
}

export interface LaunchCohortSnapshot {
	periodDays: PmfFunnelPeriodDays;
	periodStart: Date;
	periodEnd: Date;
	rows: LaunchCohortSignupRow[];
	totalSignups: number;
}

export interface LaunchCohortEventRow {
	createdAt: Date;
	metadata: string | null;
}

/** UTC Monday 00:00 for the week containing `value` (matches Postgres date_trunc('week')). */
export function startOfWeekUtc(value: Date): Date {
	const date = new Date(
		Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
	);
	const day = date.getUTCDay();
	const diff = day === 0 ? -6 : 1 - day;
	date.setUTCDate(date.getUTCDate() + diff);
	return date;
}

export function parseUtmCampaignFromMetadata(metadata: string | null | undefined): string | null {
	if (!metadata) {
		return null;
	}

	try {
		const parsed = JSON.parse(metadata) as { utm_campaign?: string };
		const campaign = parsed.utm_campaign?.trim();
		return campaign || null;
	} catch {
		return null;
	}
}

export function buildLaunchCohortSnapshot(input: {
	periodDays: PmfFunnelPeriodDays;
	periodStart: Date;
	periodEnd: Date;
	events: LaunchCohortEventRow[];
}): LaunchCohortSnapshot {
	const counts = new Map<string, number>();

	for (const event of input.events) {
		const weekStart = startOfWeekUtc(event.createdAt);
		const campaign =
			parseUtmCampaignFromMetadata(event.metadata) ?? LAUNCH_COHORT_UNKNOWN_CAMPAIGN;
		const key = `${weekStart.toISOString()}|${campaign}`;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	const rows = [...counts.entries()]
		.map(([key, signups]) => {
			const [weekIso, utmCampaign] = key.split('|');
			return {
				weekStart: new Date(weekIso),
				utmCampaign,
				signups
			};
		})
		.sort((left, right) => {
			const weekDiff = right.weekStart.getTime() - left.weekStart.getTime();
			if (weekDiff !== 0) {
				return weekDiff;
			}
			return right.signups - left.signups;
		});

	return {
		periodDays: input.periodDays,
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		rows,
		totalSignups: rows.reduce((sum, row) => sum + row.signups, 0)
	};
}
