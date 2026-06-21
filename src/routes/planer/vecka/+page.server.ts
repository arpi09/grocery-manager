import { fail } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { parseEatFirstWeekInboundSource, resolveEatFirstWeekMealCount } from '$lib/domain/eat-first-week';
import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import { isExcludedFromRecipes } from '$lib/domain/recipe-inventory-filter';
import { DEFAULT_RECIPE_PORTIONS, parseMealIntent } from '$lib/domain/recipe';
import { MEAL_PLAN_IDEAS_MAX } from '$lib/domain/meal-plan-display';
import { toIsoDate } from '$lib/domain/statistik';
import { getForwardMealDatePool, getWeekDateRange } from '$lib/domain/weekly-ritual';
import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { WeeklyRitualReadOnlyError } from '$lib/application/weekly-ritual.service';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { e2eMockRecipeSuggestions, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { requireOpenAiKey } from '$lib/server/api-guards';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import { generateRecipesWithRefinement } from '$lib/server/recipe-generation';
import { recordProductEvent } from '$lib/server/product-events';
import { approveWeeklyRitualSchema } from '$lib/validation/meal-plan.schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const householdId = locals.householdId!;
	const userId = locals.user!.id;
	const referenceDate = new Date();
	const weekRange = getWeekDateRange(referenceDate);
	const todayIso = toIsoDate(referenceDate);
	const planningDates = getForwardMealDatePool(referenceDate);
	const locale: Locale = isLocale(locals.locale) ? locals.locale : DEFAULT_LOCALE;

	const [dashboard, savings, plannedMealsThisWeek] = await Promise.all([
		locals.inventoryService.getDashboard(householdId),
		locals.statistikService.getSavingsReport(householdId),
		locals.mealPlanService.listPlannedMealsByRange(userId, weekRange.from, weekRange.to)
	]);

	const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
	const inboundSource = parseEatFirstWeekInboundSource(url.searchParams.get('from'));
	const expiringCount = dashboard.expiringSoon.length;

	recordProductEvent(locals.pmfService, {
		userId,
		householdId,
		eventType: 'eat_first_week_viewed',
		metadata: {
			expiringCount,
			inboundSource: inboundSource ?? 'direct'
		}
	});

	return {
		locale,
		pageTitle: translate(locale, 'weeklyRitual.pageTitle'),
		expiringSoon: dashboard.expiringSoon,
		weekDates: weekRange.dates,
		planningDates,
		todayIso,
		plannedMealsThisWeek: plannedMealsThisWeek.map((meal) => ({
			id: meal.id,
			title: meal.title,
			plannedDate: meal.plannedDate
		})),
		savings,
		canWrite,
		inboundSource,
		expiringCount,
		hasInventory: dashboard.totalItems > 0
	};
};

export const actions: Actions = {
	generate: async ({ request, locals }) => {
		const locale = locals.locale;
		const userId = locals.user!.id;
		const householdId = locals.householdId!;

		if (!locals.householdRole || !canEditInventory(locals.householdRole)) {
			return fail(403, {
				generateError: translate(locale, 'errors.household.forbidden')
			});
		}

		const formData = await request.formData();
		const mealIntent = parseMealIntent(formData.get('mealIntent'));
		const portions = clampRecipePortions(formData.get('portions') ?? DEFAULT_RECIPE_PORTIONS);

		const inventory = await locals.inventoryService.listAll(householdId);
		if (inventory.length === 0) {
			return {
				generateSuggestions: [],
				generateNote: translate(locale, 'recipe.noInventoryNote')
			};
		}

		const expiringItems = filterItemsExpiringWithinDays(inventory, EXPIRING_SOON_DAYS);
		const expiringItemNames = expiringItems
			.filter((item) => !isExcludedFromRecipes(item.name, item.notes))
			.map((item) => item.name.trim())
			.filter(Boolean);

		if (isE2eMockAiEnabled()) {
			const recipes = e2eMockRecipeSuggestions();
			const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(userId, recipes);
			return { generateSuggestions: savedIdeas };
		}

		const quotaResponse = await requireAiQuota(locals, 'ai_scan', userId);
		if (quotaResponse) {
			return fail(503, {
				generateError: translate(locale, 'weeklyRitual.generateFailed')
			});
		}

		const apiKeyOrResponse = requireOpenAiKey(locale, 'eat-first suggestions', 503);
		if (typeof apiKeyOrResponse !== 'string') {
			return fail(503, {
				generateError: translate(locale, 'weeklyRitual.generateFailed')
			});
		}

		const maxRecipes = resolveEatFirstWeekMealCount(expiringItems.length);
		const generated = await generateRecipesWithRefinement({
			apiKey: apiKeyOrResponse,
			inventory,
			portions,
			mode: 'eat_first',
			expiringItemNames,
			maxRecipes,
			mealIntent
		});

		if (!generated.ok) {
			console.warn(
				`[planer/vecka generate] OpenAI failed (${generated.result.status}): ${openAiErrorLogDetail(generated.result).slice(0, 500)}`
			);
			return fail(generated.result.status, {
				generateError: translateOpenAiError(locale, generated.result)
			});
		}

		if (generated.recipes.length === 0) {
			return {
				generateSuggestions: [],
				generateNote: translate(locale, generated.noteKey ?? 'recipe.noSuitableInventoryNote')
			};
		}

		const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(userId, generated.recipes);
		return { generateSuggestions: savedIdeas };
	},

	approve: async ({ request, locals }) => {
		const locale = locals.locale;
		const userId = locals.user!.id;
		const householdId = locals.householdId!;

		try {
			requireInventoryWriteAccess(locals.householdRole);
		} catch {
			return fail(403, {
				approveError: translate(locale, 'errors.household.forbidden')
			});
		}

		const formData = await request.formData();
		let assignments: unknown;
		try {
			assignments = JSON.parse(String(formData.get('assignments') ?? '[]'));
		} catch {
			return fail(400, { approveError: translate(locale, 'weeklyRitual.approveFailed') });
		}

		const parsed = approveWeeklyRitualSchema.safeParse({
			assignments,
			addMissingToList: formData.get('addMissingToList') !== 'false'
		});

		if (!parsed.success) {
			return fail(400, { approveError: translate(locale, 'weeklyRitual.approveFailed') });
		}

		const ideas = await locals.mealPlanService.listRecipeIdeas(userId, MEAL_PLAN_IDEAS_MAX);
		const ideasById = new Map(ideas.map((idea) => [idea.id, idea]));

		try {
			const result = await locals.weeklyRitualService.approveWeek(
				userId,
				householdId,
				locals.householdRole!,
				parsed.data.assignments,
				ideasById,
				parsed.data.addMissingToList
			);

			if (result.mealsScheduled > 0) {
				recordProductEvent(locals.pmfService, {
					userId,
					householdId,
					eventType: 'weekly_ritual_approved',
					metadata: {
						mealsScheduled: result.mealsScheduled,
						listAdded: result.listAdded
					}
				});
				recordProductEvent(locals.pmfService, {
					userId,
					householdId,
					eventType: 'eat_first_plan_applied',
					metadata: {
						mealsScheduled: result.mealsScheduled,
						listAdded: result.listAdded
					}
				});
			}

			const [weeklyRitualFirst, eatFirstRitual] = await Promise.all([
				locals.gamificationService.detectWeeklyRitualFirstCelebration(householdId),
				locals.gamificationService.detectEatFirstRitualCelebration(userId)
			]);

			return {
				approveSuccess: {
					mealsScheduled: result.mealsScheduled,
					listAdded: result.listAdded,
					celebration: weeklyRitualFirst ?? eatFirstRitual
				}
			};
		} catch (error) {
			if (error instanceof WeeklyRitualReadOnlyError) {
				return fail(403, { approveError: translate(locale, 'errors.household.forbidden') });
			}
			throw error;
		}
	}
};
