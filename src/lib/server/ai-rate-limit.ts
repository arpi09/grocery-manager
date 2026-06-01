import { json } from '@sveltejs/kit';
import type { AiRateLimitSnapshot } from '$lib/domain/ai-usage';
import { planLimitErrorKey, planLimitKeyForAiUsageKind } from '$lib/domain/plan-limits';
import { DEFAULT_PLAN_TIER } from '$lib/domain/plan';
import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import type { AiRateLimitService, TryConsumeAiUsageResult } from '$lib/application/ai-rate-limit.service';
import type { AiUsageKind } from '$lib/domain/ai-usage';

export function aiRateLimitErrorMessage(locale: Locale, snapshot: AiRateLimitSnapshot): string {
	return translate(locale, planLimitErrorKey(planLimitKeyForAiUsageKind(snapshot.kind)), {
		limit: snapshot.limit ?? 0
	});
}

export function aiRateLimitJsonResponse(
	locale: Locale,
	result: Extract<TryConsumeAiUsageResult, { allowed: false }>
): Response {
	const { snapshot } = result;
	return json(
		{
			error: aiRateLimitErrorMessage(locale, snapshot),
			code: 'ai_rate_limit',
			kind: snapshot.kind,
			limit: snapshot.limit,
			used: snapshot.used,
			period: snapshot.period
		},
		{ status: 429 }
	);
}

export async function requireAiQuota(
	locals: App.Locals,
	kind: AiUsageKind,
	userId: string
): Promise<Response | null> {
	if (await locals.aiUsageAdminService.isMonthlyBudgetExceeded()) {
		return json(
			{
				error: translate(locals.locale, 'errors.api.openAiMonthlyBudget'),
				code: 'openai_monthly_budget'
			},
			{ status: 503 }
		);
	}

	const result = await locals.aiRateLimitService.tryConsume({
		householdId: locals.householdId,
		userId,
		kind,
		tier: DEFAULT_PLAN_TIER
	});

	if (!result.allowed) {
		return aiRateLimitJsonResponse(locals.locale, result);
	}

	return null;
}

export async function checkAiQuotaForAction(
	locals: App.Locals,
	kind: AiUsageKind,
	userId: string
): Promise<{ denied: false } | { denied: true; message: string; snapshot: AiRateLimitSnapshot }> {
	if (await locals.aiUsageAdminService.isMonthlyBudgetExceeded()) {
		return {
			denied: true,
			message: translate(locals.locale, 'errors.api.openAiMonthlyBudget'),
			snapshot: {
				kind,
				limit: 0,
				used: 0,
				period: 'month',
				periodKey: ''
			}
		};
	}

	const result = await locals.aiRateLimitService.tryConsume({
		householdId: locals.householdId,
		userId,
		kind,
		tier: DEFAULT_PLAN_TIER
	});

	if (!result.allowed) {
		return {
			denied: true,
			message: aiRateLimitErrorMessage(locals.locale, result.snapshot),
			snapshot: result.snapshot
		};
	}

	return { denied: false };
}

export type { AiRateLimitService };
