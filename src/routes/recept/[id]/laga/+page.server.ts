import { error, redirect } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { RecipeIdeaNotFoundError } from '$lib/application/meal-plan.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}

	try {
		const idea = await locals.mealPlanService.getIdeaById(locals.user.id, params.id);
		if (idea.steps.length === 0) {
			error(404, 'Recipe has no steps');
		}
		const canWrite = locals.householdRole ? canEditInventory(locals.householdRole) : false;
		return { idea, canWrite };
	} catch (e) {
		if (e instanceof RecipeIdeaNotFoundError) {
			error(404, 'Recipe not found');
		}
		throw e;
	}
};
