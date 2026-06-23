import type { InventoryItem } from '$lib/domain/inventory-item';
import { daysUntilExpiry } from '$lib/domain/expiry';
import { isItemFinished } from '$lib/domain/inventory-item';
import { countMissingExpiry } from '$lib/domain/pantry-shelf';
import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
import {
	normalizePromptLocale,
	PROMPT_VERSION_INSIGHTS,
	promptLocaleInstruction
} from '$lib/server/ai-prompt-shared';
import {
	formatStructuredInventoryPayload,
	type PromptLocale
} from '$lib/server/inventory-context';

export type InventorySuggestedAction = 'eat_first' | 'add_expiry' | 'plan_recipe' | 'review_estimated';

export interface InventoryInsight {
	actionDate: string;
	relatedItemNames: string[];
	daysUntilExpiry: number | null;
	suggestedAction: InventorySuggestedAction;
}

export interface InventoryInsightsSnapshot {
	promptVersion: string;
	missingExpiryCount: number;
	estimatedCount: number;
	insights: InventoryInsight[];
}

export const INVENTORY_INSIGHTS_LLM_SCHEMA = {
	type: 'object',
	properties: {
		insights: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					actionDate: { type: 'string' },
					relatedItemNames: {
						type: 'array',
						items: { type: 'string' }
					},
					daysUntilExpiry: { type: ['number', 'null'] },
					suggestedAction: {
						type: 'string',
						enum: ['eat_first', 'add_expiry', 'plan_recipe', 'review_estimated']
					}
				},
				required: ['actionDate', 'relatedItemNames', 'daysUntilExpiry', 'suggestedAction'],
				additionalProperties: false
			}
		}
	},
	required: ['insights'],
	additionalProperties: false
} as const;

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Heuristic pantry insights for Brain v2 (no extra AI call). */
export function buildInventoryInsights(items: InventoryItem[]): InventoryInsightsSnapshot {
	const active = items.filter((item) => !isItemFinished(item));
	const missingExpiryCount = countMissingExpiry(active);
	const estimatedCount = active.filter((item) => isEstimatedExpirySource(item.expiresOnSource)).length;
	const insights: InventoryInsight[] = [];

	const expiringSoon = active
		.filter((item) => item.expiresOn)
		.map((item) => ({
			item,
			days: daysUntilExpiry(item.expiresOn!)
		}))
		.filter((entry) => entry.days != null && entry.days <= 5)
		.sort((a, b) => (a.days ?? 99) - (b.days ?? 99));

	if (expiringSoon.length > 0) {
		const group = expiringSoon.slice(0, 4);
		insights.push({
			actionDate: todayIso(),
			relatedItemNames: group.map((entry) => entry.item.name),
			daysUntilExpiry: group[0]?.days ?? null,
			suggestedAction: 'eat_first'
		});
	}

	if (missingExpiryCount > 0) {
		insights.push({
			actionDate: todayIso(),
			relatedItemNames: active
				.filter((item) => !item.expiresOn)
				.slice(0, 4)
				.map((item) => item.name),
			daysUntilExpiry: null,
			suggestedAction: 'add_expiry'
		});
	}

	if (estimatedCount > 0) {
		insights.push({
			actionDate: todayIso(),
			relatedItemNames: active
				.filter((item) => isEstimatedExpirySource(item.expiresOnSource))
				.slice(0, 4)
				.map((item) => item.name),
			daysUntilExpiry: null,
			suggestedAction: 'review_estimated'
		});
	}

	return {
		promptVersion: PROMPT_VERSION_INSIGHTS,
		missingExpiryCount,
		estimatedCount,
		insights: insights.slice(0, 4)
	};
}

export function buildInventoryInsightsSystemPrompt(locale: string): string {
	const promptLocale = normalizePromptLocale(locale);
	return [
		promptLocale === 'en'
			? 'You refine pantry insights for a Swedish household app.'
			: 'Du förbättrar skafferinsikter för en svensk hushållsapp.',
		promptLocaleInstruction(locale),
		'Use the heuristic snapshot as baseline — only add or refine insights where inventory data supports it.',
		'suggestedAction must be one of: eat_first, add_expiry, plan_recipe, review_estimated.',
		'Return JSON only: {"insights":[{"actionDate":"YYYY-MM-DD","relatedItemNames":[],"daysUntilExpiry":null,"suggestedAction":"eat_first"}]}',
		`- promptVersion: ${PROMPT_VERSION_INSIGHTS}`,
		'- max 4 insights, prioritize urgency'
	].join('\n');
}

export function buildInventoryInsightsUserPrompt(
	items: InventoryItem[],
	locale: string = 'sv'
): string {
	const promptLocale = normalizePromptLocale(locale) as PromptLocale;
	const heuristic = buildInventoryInsights(items);
	const inventory = formatStructuredInventoryPayload(items, promptLocale);

	return [
		`promptVersion: ${PROMPT_VERSION_INSIGHTS}`,
		`locale: ${promptLocale === 'en' ? 'en-GB' : 'sv-SE'}`,
		'Heuristic snapshot (baseline):',
		JSON.stringify({
			missingExpiryCount: heuristic.missingExpiryCount,
			estimatedCount: heuristic.estimatedCount,
			insights: heuristic.insights
		}),
		'',
		promptLocale === 'en' ? 'Inventory:' : 'Lager:',
		inventory.lines
	].join('\n');
}
