import { AI_USAGE_KINDS, type AiUsageKind } from '$lib/domain/ai-usage';

/** Rough USD per successful OpenAI call (gpt-4.1-mini), for ops guardrails only. */
export const OPENAI_ESTIMATED_USD_PER_KIND: Record<AiUsageKind, number> = {
	ai_scan: 0.015,
	receipt_pdf: 0.02,
	smart_fill: 0.008,
	admin_insights: 0.01,
	weekly_plan: 0.025
};

export const OPENAI_BUDGET_WARN_RATIO = 0.8;

export function estimateOpenAiSpendUsd(byKind: Record<AiUsageKind, number>): number {
	return AI_USAGE_KINDS.reduce(
		(sum, kind) => sum + byKind[kind] * OPENAI_ESTIMATED_USD_PER_KIND[kind],
		0
	);
}

export function parseOpenAiMonthlyBudgetUsd(raw: string | undefined): number | null {
	const trimmed = raw?.trim();
	if (!trimmed) {
		return null;
	}
	const value = Number(trimmed);
	return Number.isFinite(value) && value > 0 ? value : null;
}

export function openAiBudgetStatus(
	estimatedUsd: number,
	budgetUsd: number | null
): { overBudget: boolean; nearBudget: boolean } {
	if (budgetUsd === null) {
		return { overBudget: false, nearBudget: false };
	}
	return {
		overBudget: estimatedUsd >= budgetUsd,
		nearBudget: estimatedUsd >= budgetUsd * OPENAI_BUDGET_WARN_RATIO && estimatedUsd < budgetUsd
	};
}
