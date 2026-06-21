import { APP_HOME_PATH, INKOP_PATH } from '$lib/navigation/app-home';

export const RECIPE_ASSISTANT_FROM = 'recipe-assistant';
export const OPEN_RECIPE_ASSISTANT_PARAM = 'openRecipeAssistant';

export function isFromRecipeAssistant(fromParam: string | null): boolean {
	return fromParam === RECIPE_ASSISTANT_FROM;
}

export function recipeDetailHref(id: string, from?: string): string {
	if (!from) {
		return `/recept/${id}`;
	}
	return `/recept/${id}?from=${encodeURIComponent(from)}`;
}

export function recipeDetailFromAssistantHref(id: string): string {
	return recipeDetailHref(id, RECIPE_ASSISTANT_FROM);
}

export function recipeAssistantReturnHref(): string {
	return `${APP_HOME_PATH}?${OPEN_RECIPE_ASSISTANT_PARAM}=1`;
}

export function recipeBackHref(fromParam: string | null, fallback?: string): string {
	if (isFromRecipeAssistant(fromParam)) {
		return recipeAssistantReturnHref();
	}
	if (fromParam === 'planer') {
		return '/planer';
	}
	if (fromParam === 'inkop') {
		return INKOP_PATH;
	}
	return fallback ?? '/planer';
}
