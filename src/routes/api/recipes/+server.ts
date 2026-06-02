import { json } from '@sveltejs/kit';

import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { translateOpenAiError } from '$lib/server/openai';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import { generateRecipesWithRefinement } from '$lib/server/recipe-generation';
import { translate } from '$lib/i18n/messages';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	const apiKeyOrResponse = requireOpenAiKey(locale, 'recipe suggestions');
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

	const generated = await generateRecipesWithRefinement({
		apiKey,
		inventory,
		portions,
		preferences
	});

	if (!generated.ok) {
		return json({ error: translateOpenAiError(locale, generated.result) }, { status: generated.result.status });
	}

	const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, generated.recipes);

	return json({ recipes: savedIdeas, portions });
};
