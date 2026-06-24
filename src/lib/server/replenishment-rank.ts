import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import {
	buildNanoSystemPrompt,
	normalizePromptLocale,
	PROMPT_VERSION_SHOPPING
} from '$lib/server/ai-prompt-shared';
import { loadReplenishmentFeedbackBlock } from '$lib/server/brain-feedback-context';
import { isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { isReplenishmentRankEnabled } from '$lib/server/feature-flags';
import { getOpenAiApiKey, OPENAI_MODEL_NANO, requestStructuredJson } from '$lib/server/openai';
import { isOpenAiDegradedMode } from '$lib/server/openai-circuit-breaker';

const REPLENISHMENT_RANK_SCHEMA = {
	type: 'object',
	properties: {
		rankedKeys: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					normalizedKey: { type: 'string' },
					reason: { type: 'string' }
				},
				required: ['normalizedKey', 'reason'],
				additionalProperties: false
			}
		}
	},
	required: ['rankedKeys'],
	additionalProperties: false
} as const;

export const REPLENISHMENT_RANK_MAX = 3;

export interface RankedReplenishmentSuggestion extends ReplenishmentSuggestion {
	rankReason?: string;
}

function buildRankSystemPrompt(locale: string): string {
	return buildNanoSystemPrompt({
		locale,
		promptVersion: `${PROMPT_VERSION_SHOPPING}-replenishment-rank`,
		roleEn: 'You rank buy-again suggestions for a Swedish household shopping list.',
		roleSv: 'Du rankar köp-igen-förslag för en svensk inköpslista.',
		rules: [
			`Pick the best ${REPLENISHMENT_RANK_MAX} suggestions from the list — prioritize urgency and shopping usefulness.`,
			'Return JSON: {"rankedKeys":[{"normalizedKey":"","reason":""}]}',
			'- reason: one short sentence in the user locale',
			'- only use normalizedKey values from the input list'
		]
	});
}

function buildRankUserPrompt(suggestions: ReplenishmentSuggestion[]): string {
	return JSON.stringify({
		suggestions: suggestions.map((entry) => ({
			normalizedKey: entry.normalizedKey,
			displayName: entry.displayName,
			reasonCode: entry.reasonCode,
			daysSinceLast: entry.daysSinceLast,
			avgIntervalDays: entry.avgIntervalDays,
			importCount: entry.importCount
		}))
	});
}

export async function rankReplenishmentSuggestions(
	apiKey: string,
	suggestions: ReplenishmentSuggestion[],
	locale: string = 'sv',
	options: { replenishmentFeedbackBlock?: string } = {}
): Promise<RankedReplenishmentSuggestion[]> {
	if (suggestions.length <= REPLENISHMENT_RANK_MAX || isOpenAiDegradedMode()) {
		return suggestions.slice(0, REPLENISHMENT_RANK_MAX);
	}

	const systemPrompt = [
		buildRankSystemPrompt(locale),
		options.replenishmentFeedbackBlock?.trim() ?? ''
	]
		.filter(Boolean)
		.join('\n\n');

	const result = await requestStructuredJson(apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt,
		userPrompt: buildRankUserPrompt(suggestions),
		schemaName: 'replenishment_rank',
		schema: REPLENISHMENT_RANK_SCHEMA
	});

	if (!result.ok) {
		return suggestions.slice(0, REPLENISHMENT_RANK_MAX);
	}

	const rankedKeys = (result.data as { rankedKeys?: unknown }).rankedKeys;
	if (!Array.isArray(rankedKeys)) {
		return suggestions.slice(0, REPLENISHMENT_RANK_MAX);
	}

	const byKey = new Map(suggestions.map((entry) => [entry.normalizedKey, entry]));
	const ranked: RankedReplenishmentSuggestion[] = [];

	for (const row of rankedKeys) {
		if (!row || typeof row !== 'object') continue;
		const key = (row as { normalizedKey?: unknown }).normalizedKey;
		const reason = (row as { reason?: unknown }).reason;
		if (typeof key !== 'string' || !byKey.has(key)) continue;
		ranked.push({
			...byKey.get(key)!,
			rankReason: typeof reason === 'string' && reason.trim() ? reason.trim() : undefined
		});
		if (ranked.length >= REPLENISHMENT_RANK_MAX) break;
	}

	if (ranked.length === 0) {
		return suggestions.slice(0, REPLENISHMENT_RANK_MAX);
	}

	return ranked;
}

/** Rank replenishment when flag + API key allow; otherwise return input unchanged. */
export async function rankReplenishmentWithFeedback(
	suggestions: ReplenishmentSuggestion[],
	options: {
		householdId: string;
		locale: string;
		learningFeedbackRepository: ILearningFeedbackRepository;
		apiKey?: string | null;
	}
): Promise<RankedReplenishmentSuggestion[]> {
	if (!isReplenishmentRankEnabled()) {
		return suggestions;
	}
	if (isE2eMockAiEnabled()) {
		return suggestions;
	}

	const apiKey = options.apiKey ?? getOpenAiApiKey();
	if (!apiKey || suggestions.length <= REPLENISHMENT_RANK_MAX) {
		return suggestions;
	}

	const replenishmentFeedbackBlock = await loadReplenishmentFeedbackBlock(
		options.learningFeedbackRepository,
		options.householdId,
		normalizePromptLocale(options.locale)
	);

	return rankReplenishmentSuggestions(apiKey, suggestions, options.locale, {
		replenishmentFeedbackBlock
	});
}
