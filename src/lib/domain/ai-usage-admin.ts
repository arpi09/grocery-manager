import { AI_USAGE_KINDS, aiUsagePeriodForKind, type AiUsageKind } from '$lib/domain/ai-usage';
import { FREE_LIMITS } from '$lib/domain/plan';

export const ADMIN_AI_USAGE_PERIOD_OPTIONS = [7, 30] as const;
export type AdminAiUsagePeriodDays = (typeof ADMIN_AI_USAGE_PERIOD_OPTIONS)[number];

export const ADMIN_AI_USAGE_PERIOD_DAYS: AdminAiUsagePeriodDays = 30;
export const ADMIN_AI_USAGE_TOP_HOUSEHOLDS = 10;

export interface AdminFreeTierRateLimit {
	kind: AiUsageKind;
	limit: number;
	period: ReturnType<typeof aiUsagePeriodForKind>;
}

export function parseAdminAiUsagePeriodDays(raw: string | number | null | undefined): AdminAiUsagePeriodDays {
	const parsed = Number(raw ?? ADMIN_AI_USAGE_PERIOD_DAYS);
	if (parsed === 7) {
		return 7;
	}
	return 30;
}

export function adminFreeTierRateLimits(): AdminFreeTierRateLimit[] {
	return [
		{ kind: 'ai_scan', limit: FREE_LIMITS.aiScansPerMonth, period: 'month' },
		{ kind: 'receipt_pdf', limit: FREE_LIMITS.receiptPdfParsesPerMonth, period: 'month' },
		{ kind: 'smart_fill', limit: FREE_LIMITS.smartFillPerWeek, period: 'week' }
	];
}

export interface AdminAiUsageRepositorySummary {
	periodDays: number;
	byKind: Record<AiUsageKind, number>;
	monthlyByKind: Record<AiUsageKind, number>;
	topHouseholdCounts: number[];
	monthlyTotal: number;
	monthKey: string;
}

export interface AdminAiUsageSummary extends AdminAiUsageRepositorySummary {
	estimatedMonthlyUsd: number;
	budgetUsd: number | null;
	budgetNearLimit: boolean;
	budgetExceeded: boolean;
	freeTierLimits: AdminFreeTierRateLimit[];
}

export function emptyAdminUsageByKind(): Record<AiUsageKind, number> {
	return Object.fromEntries(AI_USAGE_KINDS.map((kind) => [kind, 0])) as Record<
		AiUsageKind,
		number
	>;
}
