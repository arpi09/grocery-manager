import { json } from '@sveltejs/kit';
import { parseMealIntent } from '$lib/domain/recipe';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { runMealSkipReplan } from '$lib/server/brain-meal-replan';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdId) {
		return json({ error: translate(locale, 'errors.household.noHousehold') }, { status: 400 });
	}

	const body = (await request.json().catch(() => ({}))) as {
		mealId?: unknown;
		replan?: unknown;
		portions?: unknown;
		mealIntent?: unknown;
	};

	const mealId = typeof body.mealId === 'string' ? body.mealId.trim() : '';
	if (!mealId) {
		return json({ error: translate(locale, 'mealPlan.missingMealId') }, { status: 400 });
	}

	const replan = body.replan !== false;
	const portions = clampRecipePortions(body.portions);
	const mealIntent = parseMealIntent(body.mealIntent);

	if (replan) {
		const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
		if (quotaResponse) {
			return quotaResponse;
		}
	}

	const apiKeyOrResponse = replan ? requireOpenAiKey(locale, 'meal skip replan', 503) : null;
	const apiKey = apiKeyOrResponse && typeof apiKeyOrResponse === 'string' ? apiKeyOrResponse : '';

	const outcome = await runMealSkipReplan({
		apiKey,
		householdId: locals.householdId,
		userId: auth.user.id,
		mealId,
		locale: locale === 'en' ? 'en' : 'sv',
		portions,
		mealIntent,
		replan,
		inventoryService: locals.inventoryService,
		mealPlanService: locals.mealPlanService,
		householdSuggestionsService: locals.householdSuggestionsService,
		householdService: locals.householdService
	});

	if (!outcome.ok) {
		if (outcome.stage === 'not_found') {
			return json({ error: translate(locale, 'mealPlan.mealNotFound') }, { status: 404 });
		}
		console.warn(
			`[brain/meal-skip] OpenAI failed (${outcome.result.status}): ${openAiErrorLogDetail(outcome.result).slice(0, 500)}`
		);
		return json({ error: translateOpenAiError(locale, outcome.result) }, { status: outcome.result.status });
	}

	return json(outcome.result);
};
