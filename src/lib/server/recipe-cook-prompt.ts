import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	estimateInputTokens,
	normalizePromptLocale,
	PROMPT_VERSION_RECIPE_COOK,
	promptLocaleInstruction
} from '$lib/server/ai-prompt-shared';
import { formatStructuredInventoryPayload, type PromptLocale } from '$lib/server/inventory-context';

export type RecipeCookConsumePreset = 'lite' | 'half' | 'all';

export interface RecipeCookMatch {
	inventoryId: string;
	ingredientName: string;
	consumePreset: RecipeCookConsumePreset;
	customAmount: string | null;
}

export interface RecipeCookSkipped {
	ingredientName: string;
	reason: string;
}

export const RECIPE_COOK_SCHEMA = {
	type: 'object',
	properties: {
		matches: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					inventoryId: { type: 'string' },
					ingredientName: { type: 'string' },
					consumePreset: { type: 'string', enum: ['lite', 'half', 'all'] },
					customAmount: { type: ['string', 'null'] }
				},
				required: ['inventoryId', 'ingredientName', 'consumePreset', 'customAmount'],
				additionalProperties: false
			}
		},
		skipped: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					ingredientName: { type: 'string' },
					reason: { type: 'string' }
				},
				required: ['ingredientName', 'reason'],
				additionalProperties: false
			}
		}
	},
	required: ['matches', 'skipped'],
	additionalProperties: false
} as const;

export interface RecipeCookPromptInput {
	title: string;
	ingredientsToUse: string[];
	ingredientIds?: string[];
	portions?: number;
	locale?: string;
}

function parseConsumePreset(value: unknown): RecipeCookConsumePreset {
	if (value === 'lite' || value === 'half' || value === 'all') {
		return value;
	}
	return 'half';
}

export function parseRecipeCookResponse(
	input: unknown,
	validInventoryIds: Set<string>
): { matches: RecipeCookMatch[]; skipped: RecipeCookSkipped[] } {
	if (!input || typeof input !== 'object') {
		return { matches: [], skipped: [] };
	}

	const raw = input as { matches?: unknown; skipped?: unknown };
	const matches: RecipeCookMatch[] = [];
	const seenIds = new Set<string>();

	if (Array.isArray(raw.matches)) {
		for (const row of raw.matches) {
			if (!row || typeof row !== 'object') continue;
			const candidate = row as Record<string, unknown>;
			const inventoryId =
				typeof candidate.inventoryId === 'string' ? candidate.inventoryId.trim() : '';
			const ingredientName =
				typeof candidate.ingredientName === 'string' ? candidate.ingredientName.trim() : '';
			if (!inventoryId || !ingredientName || !validInventoryIds.has(inventoryId)) {
				continue;
			}
			if (seenIds.has(inventoryId)) {
				continue;
			}
			seenIds.add(inventoryId);
			const customAmount =
				typeof candidate.customAmount === 'string' && candidate.customAmount.trim()
					? candidate.customAmount.trim()
					: null;
			matches.push({
				inventoryId,
				ingredientName,
				consumePreset: parseConsumePreset(candidate.consumePreset),
				customAmount
			});
		}
	}

	const skipped: RecipeCookSkipped[] = [];
	if (Array.isArray(raw.skipped)) {
		for (const row of raw.skipped) {
			if (!row || typeof row !== 'object') continue;
			const candidate = row as Record<string, unknown>;
			const ingredientName =
				typeof candidate.ingredientName === 'string' ? candidate.ingredientName.trim() : '';
			const reason = typeof candidate.reason === 'string' ? candidate.reason.trim() : '';
			if (!ingredientName || !reason) continue;
			skipped.push({ ingredientName, reason });
		}
	}

	return { matches, skipped };
}

export function buildRecipeCookSystemPrompt(locale: PromptLocale): string {
	return [
		locale === 'en'
			? 'You match recipe ingredients to pantry inventory rows for cook-mode decrement.'
			: 'Du matchar receptingredienser mot skafferirader för cook-mode-avdrag.',
		promptLocaleInstruction(locale),
		'Rules:',
		'- Only use inventoryId values present in the inventory JSON.',
		'- Match each main ingredient to at most one inventory row.',
		'- consumePreset: lite (~25%), half (~50%), all (finish row) based on typical recipe use.',
		'- Use customAmount (numeric string, same unit as inventory) when preset is too coarse.',
		'- Skip staples not tracked (salt, pepper, water) in skipped with a short reason.',
		'- Never invent inventory ids.',
		`promptVersion: ${PROMPT_VERSION_RECIPE_COOK}`,
		'Return JSON only: {"matches":[{"inventoryId":"","ingredientName":"","consumePreset":"half","customAmount":null}],"skipped":[{"ingredientName":"","reason":""}]}'
	].join('\n');
}

export function buildRecipeCookUserPrompt(
	input: RecipeCookPromptInput,
	inventory: InventoryItem[]
): string {
	const locale = normalizePromptLocale(input.locale ?? 'sv');
	const portions = input.portions && input.portions >= 1 ? Math.round(input.portions) : 4;
	const payload = formatStructuredInventoryPayload(inventory, locale, { portions });

	const idHints =
		input.ingredientIds && input.ingredientIds.length > 0
			? `\nSuggested ingredientIds (from recipe generation): ${input.ingredientIds.join(', ')}`
			: '';

	return [
		`Recipe: ${input.title.trim()}`,
		`Portions: ${portions}`,
		'Ingredients to consume:',
		input.ingredientsToUse.map((name) => `- ${name}`).join('\n'),
		idHints,
		'',
		'Inventory JSON:',
		payload.lines
	]
		.filter(Boolean)
		.join('\n');
}

export function estimateRecipeCookInputTokens(userPrompt: string, inventoryCount: number): number {
	return estimateInputTokens(userPrompt, inventoryCount);
}
