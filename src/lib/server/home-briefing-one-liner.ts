import type { DashboardSummary } from '$lib/application/inventory.service';
import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
import {
	buildNanoSystemPrompt,
	PROMPT_VERSION_INSIGHTS
} from '$lib/server/ai-prompt-shared';
import { OPENAI_MODEL_NANO, requestStructuredJson } from '$lib/server/openai';
import { isOpenAiDegradedMode } from '$lib/server/openai-circuit-breaker';

const ONE_LINER_SCHEMA = {
	type: 'object',
	properties: {
		oneLiner: { type: 'string' }
	},
	required: ['oneLiner'],
	additionalProperties: false
} as const;

function buildOneLinerSystemPrompt(locale: string): string {
	return buildNanoSystemPrompt({
		locale,
		promptVersion: `${PROMPT_VERSION_INSIGHTS}-briefing-one-liner`,
		roleEn: 'You write one actionable home briefing sentence for a Swedish pantry app.',
		roleSv: 'Du skriver en kort handlingsrad för hem-briefing i en svensk skafferapp.',
		rules: [
			'Return JSON: {"oneLiner":""}',
			'- Max 120 characters, no markdown',
			'- Prioritize expiring items, then replenishment, then list readiness',
			'- Friendly, concrete, no exclamation spam'
		]
	});
}

function buildOneLinerUserPrompt(
	summary: DashboardSummary,
	intelligence: HomeIntelligenceSnapshot,
	shoppingListCount: number
): string {
	return JSON.stringify({
		expiringSoon: summary.expiringSoon.slice(0, 5).map((item) => item.name),
		replenishment: intelligence.replenishment.slice(0, 5).map((entry) => ({
			name: entry.displayName,
			reasonCode: entry.reasonCode,
			daysSinceLast: entry.daysSinceLast
		})),
		shoppingListCount,
		wasteAlert: intelligence.waste
			? {
					expiringCount: intelligence.waste.expiringCount,
					slowMoverCount: intelligence.waste.slowMoverCount
				}
			: null
	});
}

export async function generateHomeBriefingOneLiner(
	apiKey: string,
	summary: DashboardSummary,
	intelligence: HomeIntelligenceSnapshot,
	locale: string,
	shoppingListCount = 0
): Promise<string | null> {
	if (isOpenAiDegradedMode()) return null;

	const result = await requestStructuredJson(apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt: buildOneLinerSystemPrompt(locale),
		userPrompt: buildOneLinerUserPrompt(summary, intelligence, shoppingListCount),
		schemaName: 'home_briefing_one_liner',
		schema: ONE_LINER_SCHEMA
	});

	if (!result.ok) {
		return null;
	}

	const oneLiner = (result.data as { oneLiner?: unknown }).oneLiner;
	if (typeof oneLiner !== 'string') return null;
	const trimmed = oneLiner.trim();
	return trimmed ? trimmed.slice(0, 160) : null;
}
