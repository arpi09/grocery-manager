import type { InventoryItem } from '$lib/domain/inventory-item';
import type { StructuredJsonResult } from '$lib/server/openai';
import { requestStructuredJson } from '$lib/server/openai';
import {
	buildRecipeRefinementSystemPrompt,
	buildRecipeRefinementUserPrompt,
	buildRecipeSystemPrompt,
	buildRecipeUserPrompt,
	formatRecipeInventoryLines,
	inventoryNameList,
	sanitizeRecipesAgainstInventory
} from '$lib/server/recipe-prompt';
import {
	parseRecipeSuggestions,
	RECIPE_SUGGESTIONS_SCHEMA,
	type RecipeSuggestion
} from '$lib/server/recipe-suggestions';

export type RecipeGenerationMode = 'standard' | 'eat_first';

export interface GenerateRecipesInput {
	apiKey: string;
	inventory: InventoryItem[];
	portions: number;
	preferences?: string;
	mode?: RecipeGenerationMode;
	expiringItemNames?: string[];
	maxRecipes?: number;
}

export type GenerateRecipesResult =
	| { ok: true; recipes: RecipeSuggestion[] }
	| { ok: false; result: Extract<StructuredJsonResult, { ok: false }> };

export type RequestStructuredJsonFn = typeof requestStructuredJson;

async function runRecipePass(
	requestJson: RequestStructuredJsonFn,
	apiKey: string,
	systemPrompt: string,
	userPrompt: string
): Promise<StructuredJsonResult> {
	return requestJson(apiKey, {
		systemPrompt,
		userPrompt,
		schemaName: 'recipe_suggestions',
		schema: RECIPE_SUGGESTIONS_SCHEMA
	});
}

function eatFirstContext(expiringItemNames: string[]): string {
	if (expiringItemNames.length === 0) {
		return '';
	}
	return [
		'Prioritera att använda dessa varor som går ut snart (minst en per recept om möjligt):',
		expiringItemNames.map((name) => `- ${name}`).join('\n')
	].join('\n');
}

function eatFirstPreferences(preferences: string, expiringItemNames: string[]): string {
	const parts: string[] = [];
	if (expiringItemNames.length > 0) {
		parts.push(
			`Fokus "Ät det först": prioritera varor som går ut snart (${expiringItemNames.slice(0, 8).join(', ')})`
		);
	}
	if (preferences.trim()) {
		parts.push(preferences.trim());
	}
	return parts.join('. ');
}

/**
 * Two-pass recipe pipeline: draft generation → refinement (mellan-prompt) → inventory sanitize.
 * Both LLM calls share one ai_scan quota at the API layer.
 */
export async function generateRecipesWithRefinement(
	input: GenerateRecipesInput,
	requestJson: RequestStructuredJsonFn = requestStructuredJson
): Promise<GenerateRecipesResult> {
	const {
		apiKey,
		inventory,
		portions,
		preferences = '',
		mode = 'standard',
		expiringItemNames = [],
		maxRecipes = mode === 'eat_first' ? 5 : 4
	} = input;

	const inventoryLines = formatRecipeInventoryLines(inventory);
	const inventoryNames = inventoryNameList(inventory);
	const effectivePreferences =
		mode === 'eat_first' ? eatFirstPreferences(preferences, expiringItemNames) : preferences;

	const draftResult = await runRecipePass(
		requestJson,
		apiKey,
		buildRecipeSystemPrompt(portions),
		buildRecipeUserPrompt(inventoryLines, portions, effectivePreferences)
	);

	if (!draftResult.ok) {
		return { ok: false, result: draftResult };
	}

	const draftRecipes = parseRecipeSuggestions(draftResult.data);
	if (draftRecipes.length === 0) {
		return { ok: false, result: { ok: false, status: 422, messageKey: 'errors.api.openAiInvalidJson' } };
	}

	const refinementContext =
		mode === 'eat_first' ? eatFirstContext(expiringItemNames) : undefined;

	const refineResult = await runRecipePass(
		requestJson,
		apiKey,
		buildRecipeRefinementSystemPrompt(portions),
		buildRecipeRefinementUserPrompt(
			JSON.stringify({ recipes: draftRecipes }),
			inventoryLines,
			portions,
			refinementContext
		)
	);

	if (!refineResult.ok) {
		const sanitizedDraft = sanitizeRecipesAgainstInventory(draftRecipes, inventoryNames).slice(
			0,
			maxRecipes
		);
		if (sanitizedDraft.length > 0) {
			return { ok: true, recipes: sanitizedDraft };
		}
		return { ok: false, result: refineResult };
	}

	const refined = parseRecipeSuggestions(refineResult.data);
	const recipes = sanitizeRecipesAgainstInventory(
		refined.length > 0 ? refined : draftRecipes,
		inventoryNames
	).slice(0, maxRecipes);

	if (recipes.length === 0) {
		return { ok: false, result: { ok: false, status: 422, messageKey: 'errors.api.openAiInvalidJson' } };
	}

	return { ok: true, recipes };
}
