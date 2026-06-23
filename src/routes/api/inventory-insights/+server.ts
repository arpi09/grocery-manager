import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import {
	buildInventoryInsights,
	buildInventoryInsightsSystemPrompt,
	buildInventoryInsightsUserPrompt,
	INVENTORY_INSIGHTS_LLM_SCHEMA,
	type InventoryInsight,
	type InventorySuggestedAction
} from '$lib/server/inventory-insights';
import { normalizePromptLocale } from '$lib/server/ai-prompt-shared';
import { requestStructuredJson, translateOpenAiError } from '$lib/server/openai';
import type { RequestHandler } from './$types';

const SUGGESTED_ACTIONS: InventorySuggestedAction[] = [
	'eat_first',
	'add_expiry',
	'plan_recipe',
	'review_estimated'
];

function parseSuggestedAction(value: unknown): InventorySuggestedAction {
	if (typeof value === 'string' && SUGGESTED_ACTIONS.includes(value as InventorySuggestedAction)) {
		return value as InventorySuggestedAction;
	}
	return 'eat_first';
}

function parseLlmInsights(input: unknown): InventoryInsight[] {
	if (!input || typeof input !== 'object') return [];
	const insights = (input as { insights?: unknown }).insights;
	if (!Array.isArray(insights)) return [];

	return insights
		.map((row) => {
			if (!row || typeof row !== 'object') return null;
			const candidate = row as Record<string, unknown>;
			const actionDate =
				typeof candidate.actionDate === 'string' ? candidate.actionDate.trim() : '';
			const relatedItemNames = Array.isArray(candidate.relatedItemNames)
				? candidate.relatedItemNames
						.filter((value): value is string => typeof value === 'string')
						.map((value) => value.trim())
						.filter(Boolean)
						.slice(0, 8)
				: [];
			const daysUntilExpiry =
				typeof candidate.daysUntilExpiry === 'number' && Number.isFinite(candidate.daysUntilExpiry)
					? Math.round(candidate.daysUntilExpiry)
					: null;
			const suggestedAction = parseSuggestedAction(candidate.suggestedAction);
			if (!actionDate || relatedItemNames.length === 0) return null;
			return {
				actionDate,
				relatedItemNames,
				daysUntilExpiry,
				suggestedAction
			};
		})
		.filter((insight): insight is InventoryInsight => insight !== null)
		.slice(0, 4);
}

export const POST: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const apiKeyOrResponse = requireOpenAiKey(locals.locale, 'inventory insights');
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	if (!locals.householdId) {
		return json({ insights: buildInventoryInsights([]) });
	}

	const items = await locals.inventoryService.listAll(locals.householdId);
	const heuristic = buildInventoryInsights(items);
	if (items.length === 0) {
		return json({ insights: heuristic });
	}

	const locale = normalizePromptLocale(locals.locale);
	const result = await requestStructuredJson(apiKey, {
		systemPrompt: buildInventoryInsightsSystemPrompt(locale),
		userPrompt: buildInventoryInsightsUserPrompt(items, locale),
		schemaName: 'inventory_insights_v3',
		schema: INVENTORY_INSIGHTS_LLM_SCHEMA
	});

	if (!result.ok) {
		return json({ error: translateOpenAiError(locals.locale, result) }, { status: result.status });
	}

	const llmInsights = parseLlmInsights(result.data);
	if (llmInsights.length === 0) {
		return json(
			{ error: translate(locals.locale, 'errors.api.insightsParse') },
			{ status: 502 }
		);
	}

	return json({
		insights: {
			...heuristic,
			insights: llmInsights
		},
		source: 'llm'
	});
};
