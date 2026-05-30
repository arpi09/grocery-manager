import { json } from '@sveltejs/kit';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requestStructuredJson } from '$lib/server/openai';
import {
	buildRecipeSystemPrompt,
	buildRecipeUserPrompt,
	clampRecipePortions,
	formatRecipeInventoryLines,
	inventoryNameList,
	sanitizeRecipesAgainstInventory
} from '$lib/server/recipe-prompt';
import {
	parseRecipeSuggestions,
	RECIPE_SUGGESTIONS_SCHEMA
} from '$lib/server/recipe-suggestions';
import { translate } from '$lib/i18n/messages';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const apiKeyOrResponse = requireOpenAiKey('recipe suggestions');
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const body = (await request.json().catch(() => ({}))) as {
		preferences?: unknown;
		portions?: unknown;
	};
	const preferences = typeof body.preferences === 'string' ? body.preferences.trim().slice(0, 300) : '';
	const portions = clampRecipePortions(body.portions);

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	if (inventory.length === 0) {
		return json({
			recipes: [],
			note: translate(locale, 'recipe.noInventoryNote')
		});
	}

	const inventoryLines = formatRecipeInventoryLines(inventory);
	const inventoryNames = inventoryNameList(inventory);

	const systemPrompt = buildRecipeSystemPrompt(portions);
	const userPrompt = buildRecipeUserPrompt(inventoryLines, portions, preferences);

	const result = await requestStructuredJson(apiKey, {
		systemPrompt,
		userPrompt,
		schemaName: 'recipe_suggestions',
		schema: RECIPE_SUGGESTIONS_SCHEMA
	});

	if (!result.ok) {
		return json({ error: result.message }, { status: result.status });
	}

	const parsed = parseRecipeSuggestions(result.data);
	const recipes = sanitizeRecipesAgainstInventory(parsed, inventoryNames);
	if (recipes.length === 0) {
		return json({ error: translate(locale, 'recipe.parseFromAi') }, { status: 422 });
	}

	const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, recipes);

	return json({ recipes: savedIdeas, portions });
};
