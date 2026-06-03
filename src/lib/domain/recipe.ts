export const DEFAULT_RECIPE_PORTIONS = 4;
export const MIN_RECIPE_PORTIONS = 1;
export const MAX_RECIPE_PORTIONS = 8;

export type MealIntent = 'quick' | 'friday' | 'meal_prep';
export const DEFAULT_MEAL_INTENT: MealIntent = 'quick';

const MEAL_INTENTS: MealIntent[] = ['quick', 'friday', 'meal_prep'];

export function parseMealIntent(value: unknown): MealIntent {
	if (typeof value === 'string' && MEAL_INTENTS.includes(value as MealIntent)) {
		return value as MealIntent;
	}
	return DEFAULT_MEAL_INTENT;
}
