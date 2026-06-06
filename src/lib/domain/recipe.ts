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

export interface RecipeStep {
	instruction: string;
	minutes?: number;
}

export function normalizeRecipeStep(raw: unknown): RecipeStep | null {
	if (typeof raw === 'string') {
		const instruction = raw.trim();
		return instruction ? { instruction } : null;
	}

	if (!raw || typeof raw !== 'object') {
		return null;
	}

	const candidate = raw as Record<string, unknown>;
	const instruction =
		typeof candidate.instruction === 'string' ? candidate.instruction.trim() : '';
	if (!instruction) {
		return null;
	}

	let minutes: number | undefined;
	if (typeof candidate.minutes === 'number' && Number.isFinite(candidate.minutes)) {
		minutes = Math.min(120, Math.max(1, Math.round(candidate.minutes)));
	}

	return minutes !== undefined ? { instruction, minutes } : { instruction };
}

/** Backward-compat: legacy string[] and structured RecipeStep[] in DB/API. */
export function normalizeRecipeSteps(raw: unknown): RecipeStep[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	return raw.map(normalizeRecipeStep).filter((step): step is RecipeStep => step !== null);
}

export function totalMinutes(steps: RecipeStep[]): number | null {
	const timed = steps.filter((step) => step.minutes != null);
	if (timed.length === 0) {
		return null;
	}
	return timed.reduce((sum, step) => sum + (step.minutes ?? 0), 0);
}
