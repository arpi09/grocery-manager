import { json } from '@sveltejs/kit';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requestStructuredJson } from '$lib/server/openai';
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

	const body = (await request.json().catch(() => ({}))) as { preferences?: unknown };
	const preferences = typeof body.preferences === 'string' ? body.preferences.trim().slice(0, 300) : '';

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	if (inventory.length === 0) {
		return json({
			recipes: [],
			note: translate(locale, 'recipe.noInventoryNote')
		});
	}

	const inventoryLines = inventory
		.map((item) => {
			const unit = item.unit ? ` ${item.unit}` : '';
			const notes = item.notes ? ` (anteckning: ${item.notes})` : '';
			return `- ${item.name}: ${item.quantity}${unit} i ${item.location}${notes}`;
		})
		.join('\n');

	const systemPrompt = [
		'You are a practical home-cooking assistant.',
		'Create up to 4 recipes based primarily on available inventory.',
		'Prefer recipes that minimize waste and prioritize items with expiry dates.',
		'Respond in Swedish (sv-SE) for title, whyItFits, ingredients, and steps.',
		'Each recipe must include:',
		'- title',
		'- whyItFits (short sentence)',
		'- ingredientsToUse (from inventory)',
		'- missingIngredients (optional extras; use empty array if none)',
		'- steps (concise instructions as plain strings)',
		'Return valid JSON only in this shape:',
		'{"recipes":[{"title":"","whyItFits":"","ingredientsToUse":[],"missingIngredients":[],"steps":[]}]}',
		'Do not include markdown code fences.'
	].join('\n');

	const userPrompt = [
		'Inventory:',
		inventoryLines,
		preferences ? `\nPreferences from user: ${preferences}` : ''
	].join('\n');

	const result = await requestStructuredJson(apiKey, {
		systemPrompt,
		userPrompt,
		schemaName: 'recipe_suggestions',
		schema: RECIPE_SUGGESTIONS_SCHEMA
	});

	if (!result.ok) {
		return json({ error: result.message }, { status: result.status });
	}

	const recipes = parseRecipeSuggestions(result.data);
	if (recipes.length === 0) {
		return json({ error: translate(locale, 'recipe.parseFromAi') }, { status: 422 });
	}

	const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, recipes);

	return json({ recipes: savedIdeas });
};
