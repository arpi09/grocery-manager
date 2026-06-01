import { AI_USAGE_KINDS, type AiUsageKind } from '$lib/domain/ai-usage';

export const ADMIN_AI_USAGE_PERIOD_DAYS = 30;
export const ADMIN_AI_USAGE_TOP_HOUSEHOLDS = 10;

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
}

export function emptyAdminUsageByKind(): Record<AiUsageKind, number> {
	return Object.fromEntries(AI_USAGE_KINDS.map((kind) => [kind, 0])) as Record<
		AiUsageKind,
		number
	>;
}
