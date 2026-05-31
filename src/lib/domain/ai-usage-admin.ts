import { AI_USAGE_KINDS, type AiUsageKind } from '$lib/domain/ai-usage';

export const ADMIN_AI_USAGE_PERIOD_DAYS = 30;
export const ADMIN_AI_USAGE_TOP_HOUSEHOLDS = 10;

export interface AdminAiUsageSummary {
	periodDays: number;
	byKind: Record<AiUsageKind, number>;
	topHouseholdCounts: number[];
	monthlyTotal: number;
	monthKey: string;
}

export function emptyAdminUsageByKind(): Record<AiUsageKind, number> {
	return Object.fromEntries(AI_USAGE_KINDS.map((kind) => [kind, 0])) as Record<
		AiUsageKind,
		number
	>;
}
