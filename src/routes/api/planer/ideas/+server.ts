import { json } from '@sveltejs/kit';
import { MEAL_PLAN_IDEAS_DEFAULT, MEAL_PLAN_IDEAS_MAX } from '$lib/domain/meal-plan-display';
import { requireUser } from '$lib/server/api-guards';
import type { RequestHandler } from './$types';

function parseLimit(raw: string | null, defaultValue: number, max: number): number {
	const parsed = Number(raw ?? defaultValue);
	if (!Number.isFinite(parsed)) {
		return defaultValue;
	}
	return Math.min(max, Math.max(1, Math.floor(parsed)));
}

function serializeIdea<T extends { createdAt: Date }>(
	idea: T
): Omit<T, 'createdAt'> & { createdAt: string } {
	return {
		...idea,
		createdAt: idea.createdAt.toISOString()
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const limit = parseLimit(
		url.searchParams.get('limit'),
		MEAL_PLAN_IDEAS_DEFAULT,
		MEAL_PLAN_IDEAS_MAX
	);
	const ideas = await locals.mealPlanService.listRecipeIdeas(auth.user.id, limit);

	return json({ ideas: ideas.map(serializeIdea) });
};
