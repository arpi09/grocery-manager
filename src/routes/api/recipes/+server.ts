import { json } from '@sveltejs/kit';

import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import { parseMealIntent } from '$lib/domain/recipe';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import { generateRecipesWithRefinement } from '$lib/server/recipe-generation';
import { translate } from '$lib/i18n/messages';
import { e2eMockRecipeSuggestions, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = (await request.json().catch(() => ({}))) as {
		preferences?: unknown;
		portions?: unknown;
		mealIntent?: unknown;
	};

	const preferences = typeof body.preferences === 'string' ? body.preferences.trim().slice(0, 300) : '';
	const portions = clampRecipePortions(body.portions);
	const mealIntent = parseMealIntent(body.mealIntent);

	if (isE2eMockAiEnabled()) {
		const recipes = e2eMockRecipeSuggestions();
		const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, recipes);
		return json({ recipes: savedIdeas, portions });
	}

	const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	const apiKeyOrResponse = requireOpenAiKey(locale, 'recipe suggestions', 503);
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	if (inventory.length === 0) {
		return json({
			recipes: [],
			note: translate(locale, 'recipe.noInventoryNote')
		});
	}

	const generated = await generateRecipesWithRefinement({
		apiKey,
		inventory,
		portions,
		preferences,
		mealIntent
	});

	if (!generated.ok) {
		console.warn(
			`[recipes] OpenAI generation failed (${generated.result.status}): ${openAiErrorLogDetail(generated.result).slice(0, 500)}`
		);
		return json({ error: translateOpenAiError(locale, generated.result) }, { status: generated.result.status });
	}

	if (generated.recipes.length === 0) {
		return json({
			recipes: [],
			portions,
			note: translate(locale, generated.noteKey ?? ('recipe.noSuitableInventoryNote' as const))
		});
	}

	const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, generated.recipes);

	return json({ recipes: savedIdeas, portions });
};
