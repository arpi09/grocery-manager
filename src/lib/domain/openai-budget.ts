import { AI_USAGE_KINDS, type AiUsageKind } from '$lib/domain/ai-usage';
import type { AiBatchKind } from '$lib/domain/ai-batch';

/** Rough USD per successful OpenAI call (gpt-5.4-mini), for ops guardrails only. */
export const OPENAI_ESTIMATED_USD_PER_KIND: Record<AiUsageKind, number> = {
	ai_scan: 0.03,
	receipt_pdf: 0.04,
	smart_fill: 0.015,
	admin_insights: 0.02,
	weekly_plan: 0.05
};

/** Batch API discounts input+output tokens by 50% vs the synchronous Responses API. */
export const OPENAI_BATCH_DISCOUNT_RATIO = 0.5;

/**
 * Rough USD per successful Batch API request, already batch-discounted.
 * Feeds cron logging/telemetry for the batch runner — NOT the user-facing
 * rate-limit budget in OPENAI_ESTIMATED_USD_PER_KIND (those track interactive
 * spend). missing_expiry batches up to 40 items per request on the nano model;
 * expiry_push is a nano one-liner; admin_digest is one mini paragraph/week.
 */
export const OPENAI_BATCH_ESTIMATED_USD_PER_KIND: Record<AiBatchKind, number> = {
	missing_expiry: 0.002 * OPENAI_BATCH_DISCOUNT_RATIO,
	expiry_push: 0.0004 * OPENAI_BATCH_DISCOUNT_RATIO,
	admin_digest: 0.02 * OPENAI_BATCH_DISCOUNT_RATIO
};

export function estimateOpenAiBatchSpendUsd(requestsByKind: Partial<Record<AiBatchKind, number>>): number {
	return (Object.entries(requestsByKind) as Array<[AiBatchKind, number]>).reduce(
		(sum, [kind, count]) => sum + (count ?? 0) * OPENAI_BATCH_ESTIMATED_USD_PER_KIND[kind],
		0
	);
}

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
