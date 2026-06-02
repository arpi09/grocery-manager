import { json } from '@sveltejs/kit';

import { requireUser } from '$lib/server/api-guards';
import { scheduleIdeaSchema } from '$lib/validation/meal-plan.schemas';
import { translate } from '$lib/i18n/messages';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = (await request.json().catch(() => ({}))) as {
		ideaId?: unknown;
		plannedDate?: unknown;
	};

	const parsed = scheduleIdeaSchema.safeParse({
		ideaId: body.ideaId,
		plannedDate: body.plannedDate
	});

	if (!parsed.success) {
		return json(
			{ error: translate(locals.locale, 'eatFirst.scheduleFailed') },
			{ status: 400 }
		);
	}

	try {
		const meal = await locals.mealPlanService.createPlannedMealFromIdea(
			auth.user.id,
			parsed.data.ideaId,
			parsed.data.plannedDate
		);

		const celebration = await locals.gamificationService.detectEatFirstRitualCelebration(
			auth.user.id
		);

		return json({
			ok: true,
			meal: {
				id: meal.id,
				title: meal.title,
				plannedDate: meal.plannedDate
			},
			celebration
		});
	} catch {
		return json(
			{ error: translate(locals.locale, 'eatFirst.scheduleFailed') },
			{ status: 404 }
		);
	}
};
