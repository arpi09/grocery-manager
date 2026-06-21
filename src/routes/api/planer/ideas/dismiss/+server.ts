import { json } from '@sveltejs/kit';
import { RecipeIdeaNotFoundError } from '$lib/application/meal-plan.service';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { recordProductEvent } from '$lib/server/product-events';
import { dismissIdeaSchema } from '$lib/validation/meal-plan.schemas';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = (await request.json().catch(() => ({}))) as { ideaId?: unknown };
	const parsed = dismissIdeaSchema.safeParse({ ideaId: body.ideaId });

	if (!parsed.success) {
		return json({ error: translate(locals.locale, 'planer.dismissFailed') }, { status: 400 });
	}

	try {
		await locals.mealPlanService.dismissRecipeIdea(auth.user.id, parsed.data.ideaId);
		recordProductEvent(locals.pmfService, {
			userId: auth.user.id,
			householdId: locals.householdId ?? null,
			eventType: 'planer_idea_dismissed',
			metadata: { ideaId: parsed.data.ideaId }
		});
		return json({ ok: true });
	} catch (error) {
		if (error instanceof RecipeIdeaNotFoundError) {
			return json({ error: translate(locals.locale, 'planer.dismissFailed') }, { status: 404 });
		}
		throw error;
	}
};
