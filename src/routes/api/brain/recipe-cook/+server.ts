import { json } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { runRecipeCookFlow } from '$lib/server/recipe-cook';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdId || !locals.householdRole || !canEditInventory(locals.householdRole)) {
		return json({ error: translate(locale, 'scan.readonly') }, { status: 403 });
	}

	const body = (await request.json().catch(() => ({}))) as {
		title?: unknown;
		ingredientsToUse?: unknown;
		ingredientIds?: unknown;
		portions?: unknown;
	};

	const title = typeof body.title === 'string' ? body.title.trim() : '';
	const ingredientsToUse = Array.isArray(body.ingredientsToUse)
		? body.ingredientsToUse
				.filter((value): value is string => typeof value === 'string')
				.map((value) => value.trim())
				.filter(Boolean)
				.slice(0, 24)
		: [];
	const ingredientIds = Array.isArray(body.ingredientIds)
		? body.ingredientIds
				.filter((value): value is string => typeof value === 'string')
				.map((value) => value.trim())
				.filter(Boolean)
				.slice(0, 24)
		: undefined;
	const portions =
		typeof body.portions === 'number' && body.portions >= 1 && body.portions <= 12
			? Math.round(body.portions)
			: 4;

	if (!title || ingredientsToUse.length === 0) {
		return json({ error: translate(locale, 'recipe.cook.missingPayload') }, { status: 400 });
	}

	const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	const apiKeyOrResponse = requireOpenAiKey(locale, 'recipe cook', 503);
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}

	const outcome = await runRecipeCookFlow({
		apiKey: apiKeyOrResponse,
		householdId: locals.householdId,
		userId: auth.user.id,
		actorRole: locals.householdRole,
		inventoryService: locals.inventoryService,
		title,
		ingredientsToUse,
		ingredientIds,
		portions,
		locale: locale === 'en' ? 'en' : 'sv'
	});

	if (!outcome.ok) {
		console.warn(
			`[brain/recipe-cook] OpenAI failed (${outcome.result.status}): ${openAiErrorLogDetail(outcome.result).slice(0, 500)}`
		);
		return json({ error: translateOpenAiError(locale, outcome.result) }, { status: outcome.result.status });
	}

	return json(outcome.result);
};
