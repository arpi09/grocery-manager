import { json } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { parseMealIntent } from '$lib/domain/recipe';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { applyWeeklyPlan, runWeeklyPlanOrchestrator } from '$lib/server/brain-weekly-plan';
import { learningFeedbackRepository } from '$lib/server/di';
import { e2eMockRecipeSuggestions, e2eMockShoppingSuggestions, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import { distributeMealDates } from '$lib/domain/weekly-ritual';
import { PROMPT_VERSION_WEEKLY_PLAN } from '$lib/server/ai-prompt-shared';
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
		portions?: unknown;
		mealIntent?: unknown;
		preferences?: unknown;
		householdSize?: unknown;
		apply?: unknown;
		scheduleMeals?: unknown;
		addShoppingToList?: unknown;
	};

	const portions = clampRecipePortions(body.portions);
	const mealIntent = parseMealIntent(body.mealIntent);
	const preferences = typeof body.preferences === 'string' ? body.preferences.trim().slice(0, 300) : '';
	const apply = body.apply === true;
	const scheduleMeals = body.scheduleMeals !== false;
	const addShoppingToList = body.addShoppingToList !== false;

	if (isE2eMockAiEnabled()) {
		const recipes = await locals.mealPlanService.storeGeneratedIdeas(
			auth.user.id,
			e2eMockRecipeSuggestions()
		);
		const mealDates = distributeMealDates(recipes.length);
		const shopping = e2eMockShoppingSuggestions();
		const plan = {
			promptVersion: PROMPT_VERSION_WEEKLY_PLAN,
			recipes,
			mealSlots: recipes.slice(0, mealDates.length).map((idea, index) => ({
				ideaId: idea.id,
				title: idea.title,
				plannedDate: mealDates[index]!
			})),
			shoppingItems: shopping.items,
			shoppingNote: shopping.note,
			expiringItems: [],
			portions
		};

		if (apply) {
			const applied = await applyWeeklyPlan({
				userId: auth.user.id,
				householdId: locals.householdId,
				role: locals.householdRole,
				plan,
				mealPlanService: locals.mealPlanService,
				shoppingListService: locals.shoppingListService,
				scheduleMeals,
				addShoppingToList
			});
			return json({ plan, applied });
		}

		return json({ plan });
	}

	const quotaResponse = await requireAiQuota(locals, 'weekly_plan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	const apiKeyOrResponse = requireOpenAiKey(locale, 'weekly plan', 503);
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}

	const outcome = await runWeeklyPlanOrchestrator({
		apiKey: apiKeyOrResponse,
		householdId: locals.householdId,
		userId: auth.user.id,
		locale: locale === 'en' ? 'en' : 'sv',
		portions,
		mealIntent,
		preferences,
		householdSize: typeof body.householdSize === 'number' ? body.householdSize : undefined,
		inventoryService: locals.inventoryService,
		mealPlanService: locals.mealPlanService,
		shoppingListService: locals.shoppingListService,
		householdSuggestionsService: locals.householdSuggestionsService,
		householdService: locals.householdService,
		learningFeedbackRepository
	});

	if (!outcome.ok) {
		if (outcome.stage === 'empty') {
			return json({
				plan: null,
				note: translate(locale, outcome.messageKey)
			});
		}
		if (outcome.stage === 'shopping') {
			return json(
				{ error: translate(locale, outcome.result.messageKey) },
				{ status: outcome.result.status }
			);
		}
		console.warn(
			`[brain/weekly-plan] OpenAI failed (${outcome.result.status}): ${openAiErrorLogDetail(outcome.result).slice(0, 500)}`
		);
		return json({ error: translateOpenAiError(locale, outcome.result) }, { status: outcome.result.status });
	}

	if (apply) {
		const applied = await applyWeeklyPlan({
			userId: auth.user.id,
			householdId: locals.householdId,
			role: locals.householdRole,
			plan: outcome.plan,
			mealPlanService: locals.mealPlanService,
			shoppingListService: locals.shoppingListService,
			scheduleMeals,
			addShoppingToList
		});
		return json({ plan: outcome.plan, applied });
	}

	return json({ plan: outcome.plan });
};
