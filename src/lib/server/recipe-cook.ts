import type { HouseholdRole } from '$lib/domain/household';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { InventoryService } from '$lib/application/inventory.service';
import { logBrainMetrics } from '$lib/server/brain-metrics';
import { OPENAI_MODEL_NANO, requestStructuredJson, type StructuredJsonResult } from '$lib/server/openai';
import {
	buildRecipeCookSystemPrompt,
	buildRecipeCookUserPrompt,
	estimateRecipeCookInputTokens,
	parseRecipeCookResponse,
	RECIPE_COOK_SCHEMA,
	type RecipeCookMatch,
	type RecipeCookPromptInput,
	type RecipeCookSkipped
} from '$lib/server/recipe-cook-prompt';
import { normalizePromptLocale, PROMPT_VERSION_RECIPE_COOK } from '$lib/server/ai-prompt-shared';

export interface ApplyRecipeCookInput extends RecipeCookPromptInput {
	apiKey: string;
	householdId: string;
	userId: string;
	actorRole: HouseholdRole;
	inventoryService: InventoryService;
}

export interface RecipeCookApplyResult {
	consumed: number;
	finished: number;
	matches: RecipeCookMatch[];
	skipped: RecipeCookSkipped[];
}

export type RecipeCookGenerationResult =
	| { ok: true; parsed: ReturnType<typeof parseRecipeCookResponse> }
	| { ok: false; result: Extract<StructuredJsonResult, { ok: false }> };

export async function generateRecipeCookMatches(
	input: ApplyRecipeCookInput,
	inventory: InventoryItem[]
): Promise<RecipeCookGenerationResult> {
	const locale = normalizePromptLocale(input.locale ?? 'sv');
	const userPrompt = buildRecipeCookUserPrompt(input, inventory);
	const systemPrompt = buildRecipeCookSystemPrompt(locale);

	const result = await requestStructuredJson(input.apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt,
		userPrompt,
		schemaName: 'recipe_cook_v1',
		schema: RECIPE_COOK_SCHEMA
	});

	if (!result.ok) {
		return { ok: false, result };
	}

	logBrainMetrics('recipe_cook', {
		source: 'recipe_cook',
		promptVersion: PROMPT_VERSION_RECIPE_COOK,
		inputTokenEstimate: estimateRecipeCookInputTokens(userPrompt, inventory.length)
	});

	const validIds = new Set(inventory.map((item) => item.id));
	return { ok: true, parsed: parseRecipeCookResponse(result.data, validIds) };
}

export async function applyRecipeCookMatches(
	householdId: string,
	userId: string,
	actorRole: HouseholdRole,
	inventoryService: InventoryService,
	matches: RecipeCookMatch[]
): Promise<{ consumed: number; finished: number }> {
	let consumed = 0;
	let finished = 0;

	for (const match of matches) {
		try {
			const outcome = await inventoryService.consumeItem(
				householdId,
				match.inventoryId,
				userId,
				actorRole,
				match.customAmount
					? { customAmount: match.customAmount }
					: { preset: match.consumePreset }
			);
			consumed += 1;
			if (outcome.finished) {
				finished += 1;
			}
		} catch {
			// skip missing or readonly rows
		}
	}

	return { consumed, finished };
}

export async function runRecipeCookFlow(input: ApplyRecipeCookInput): Promise<
	| { ok: true; result: RecipeCookApplyResult }
	| { ok: false; result: Extract<StructuredJsonResult, { ok: false }> }
> {
	const inventory = await input.inventoryService.listAll(input.householdId);
	const generated = await generateRecipeCookMatches(input, inventory);
	if (!generated.ok) {
		return generated;
	}

	const applied = await applyRecipeCookMatches(
		input.householdId,
		input.userId,
		input.actorRole,
		input.inventoryService,
		generated.parsed.matches
	);

	return {
		ok: true,
		result: {
			...applied,
			matches: generated.parsed.matches,
			skipped: generated.parsed.skipped
		}
	};
}
