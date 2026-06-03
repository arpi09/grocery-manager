import type { RecipeIdea } from '$lib/domain/meal-plan';

/** Lookup map for calendar / meal rows keyed by recipe idea id. */
export function ideasByIdFromList(ideas: RecipeIdea[]): Record<string, RecipeIdea> {
	return Object.fromEntries(ideas.map((idea) => [idea.id, idea]));
}
