import { json } from '@sveltejs/kit';

import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import { isExcludedFromRecipes } from '$lib/domain/recipe-inventory-filter';
import { DEFAULT_RECIPE_PORTIONS, parseMealIntent } from '$lib/domain/recipe';
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

	const apiKeyOrResponse = requireOpenAiKey(locale, 'eat-first suggestions');
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const body = (await request.json().catch(() => ({}))) as {
		portions?: unknown;
		mealIntent?: unknown;
	};

	const portions = clampRecipePortions(body.portions ?? DEFAULT_RECIPE_PORTIONS);
	const mealIntent = parseMealIntent(body.mealIntent);

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	if (inventory.length === 0) {
		return json({
			suggestions: [],
			expiringItems: [],
			note: translate(locale, 'recipe.noInventoryNote')
		});
	}

	const expiringItems = filterItemsExpiringWithinDays(inventory, EXPIRING_SOON_DAYS);
	const expiringItemNames = expiringItems
		.filter((item) => !isExcludedFromRecipes(item.name, item.notes))
		.map((item) => item.name.trim())
		.filter(Boolean);

	const generated = await generateRecipesWithRefinement({
		apiKey,
		inventory,
		portions,
		mode: 'eat_first',
		expiringItemNames,
		maxRecipes: 5,
		mealIntent
	});

	if (!generated.ok) {
		return json({ error: translateOpenAiError(locale, generated.result) }, { status: generated.result.status });
	}

	if (generated.recipes.length === 0) {
		return json({
			suggestions: [],
			expiringItems: expiringItems.map((item) => ({
				id: item.id,
				name: item.name,
				expiresOn: item.expiresOn,
				location: item.location
			})),
			portions,
			note: translate(locale, generated.noteKey ?? ('recipe.noSuitableInventoryNote' as const))
		});
	}

	const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, generated.recipes);

	return json({
		suggestions: savedIdeas,
		expiringItems: expiringItems.map((item) => ({
			id: item.id,
			name: item.name,
			expiresOn: item.expiresOn,
			location: item.location
		})),
		portions
	});
};
