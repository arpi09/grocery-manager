import { getAiLimit, isProTier, type PlanTier } from '$lib/domain/plan';

export const AI_USAGE_KINDS = [
	'ai_scan',
	'receipt_pdf',
	'smart_fill',
	'admin_insights',
	'weekly_plan'
] as const;

export type AiUsageKind = (typeof AI_USAGE_KINDS)[number];

export type AiUsagePeriod = 'month' | 'week';

export interface AiRateLimitSnapshot {
	kind: AiUsageKind;
	limit: number | null;
	used: number;
	period: AiUsagePeriod;
	periodKey: string;
}

export function aiUsagePeriodForKind(kind: AiUsageKind): AiUsagePeriod {
	if (kind === 'smart_fill' || kind === 'admin_insights' || kind === 'weekly_plan') {
		return 'week';
	}
	return 'month';
}

export function monthPeriodKey(date = new Date()): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** ISO week key, e.g. 2026-W22 */
export function isoWeekPeriodKey(date = new Date()): string {
	const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const day = utc.getUTCDay() || 7;
	utc.setUTCDate(utc.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
	return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function periodKeyForKind(kind: AiUsageKind, date = new Date()): string {
	return aiUsagePeriodForKind(kind) === 'week' ? isoWeekPeriodKey(date) : monthPeriodKey(date);
}

/** Household scope when available; otherwise per-user fallback. */
export function resolveAiUsageScope(householdId: string | null, userId: string): string {
	return householdId ?? `user:${userId}`;
}

export function isWithinAiLimit(
	tier: PlanTier,
	kind: AiUsageKind,
	used: number
): boolean {
	if (isProTier(tier)) {
		return true;
	}
	const limit = getAiLimit(tier, kind);
	return limit !== null && used < limit;
}
