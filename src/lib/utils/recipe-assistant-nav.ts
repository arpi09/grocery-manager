import { APP_HOME_PATH } from '$lib/navigation/app-home';

export const RECIPE_ASSISTANT_FROM = 'recipe-assistant';
export const OPEN_RECIPE_ASSISTANT_PARAM = 'openRecipeAssistant';

export function isFromRecipeAssistant(fromParam: string | null): boolean {
	return fromParam === RECIPE_ASSISTANT_FROM;
}

export function recipeDetailFromAssistantHref(id: string): string {
	return `/recept/${id}?from=${RECIPE_ASSISTANT_FROM}`;
}

export function recipeAssistantReturnHref(): string {
	return `${APP_HOME_PATH}?${OPEN_RECIPE_ASSISTANT_PARAM}=1`;
}
