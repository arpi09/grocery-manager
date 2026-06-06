import { json } from '@sveltejs/kit';

import { MEAL_PLAN_IDEAS_MAX } from '$lib/domain/meal-plan-display';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { recordProductEvent } from '$lib/server/product-events';
import { approveWeeklyRitualSchema } from '$lib/validation/meal-plan.schemas';
import { WeeklyRitualReadOnlyError } from '$lib/application/weekly-ritual.service';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		requireInventoryWriteAccess(locals.householdRole);
	} catch {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	const body = (await request.json().catch(() => ({}))) as {
		assignments?: unknown;
		addMissingToList?: unknown;
	};

	const parsed = approveWeeklyRitualSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ error: translate(locals.locale, 'weeklyRitual.approveFailed') },
			{ status: 400 }
		);
	}

	const ideas = await locals.mealPlanService.listRecipeIdeas(auth.user.id, MEAL_PLAN_IDEAS_MAX);
	const ideasById = new Map(ideas.map((idea) => [idea.id, idea]));

	try {
		const result = await locals.weeklyRitualService.approveWeek(
			auth.user.id,
			auth.householdId,
			locals.householdRole!,
			parsed.data.assignments,
			ideasById,
			parsed.data.addMissingToList
		);

		if (result.mealsScheduled > 0) {
			recordProductEvent(locals.pmfService, {
				userId: auth.user.id,
				householdId: auth.householdId,
				eventType: 'weekly_ritual_approved',
				metadata: {
					mealsScheduled: result.mealsScheduled,
					listAdded: result.listAdded
				}
			});
		}

		const celebration = await locals.gamificationService.detectEatFirstRitualCelebration(
			auth.user.id
		);

		return json({
			ok: true,
			...result,
			celebration
		});
	} catch (error) {
		if (error instanceof WeeklyRitualReadOnlyError) {
			return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
		}
		throw error;
	}
};
