import type { RecipeIdea } from '$lib/domain/meal-plan';
import { normalizeRecipeSteps } from '$lib/domain/recipe';

export type RecipeIdeaLoad = Omit<RecipeIdea, 'createdAt' | 'steps'> & {
	createdAt: string | Date;
	steps: unknown;
};

export function normalizeRecipeIdeas(ideas: RecipeIdeaLoad[]): RecipeIdea[] {
	return ideas.map((idea) => ({
		...idea,
		steps: normalizeRecipeSteps(idea.steps),
		createdAt: idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt)
	}));
}

/** Lookup map for calendar / meal rows keyed by recipe idea id. */
export function ideasByIdFromList(ideas: RecipeIdeaLoad[]): Record<string, RecipeIdea> {
	return Object.fromEntries(normalizeRecipeIdeas(ideas).map((idea) => [idea.id, idea]));
}
