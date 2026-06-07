import type { RecipeIdea } from '$lib/domain/meal-plan';
import { DEFAULT_MEAL_INTENT, DEFAULT_RECIPE_PORTIONS, type MealIntent } from '$lib/domain/recipe';

/** Persists generated recipe ideas across route changes (AppLayout remounts per page). */
export const recipeAssistantStore = $state({
	recipes: [] as RecipeIdea[],
	preferences: '',
	portions: DEFAULT_RECIPE_PORTIONS,
	mealIntent: DEFAULT_MEAL_INTENT as MealIntent,
	note: null as string | null
});

export function hasRecipeAssistantResults(): boolean {
	return recipeAssistantStore.recipes.length > 0;
}

export function setRecipeAssistantResults(recipes: RecipeIdea[], note: string | null): void {
	recipeAssistantStore.recipes = recipes;
	recipeAssistantStore.note = note;
}
