import { normalizeRecipeSteps, type RecipeStep } from '$lib/domain/recipe';

export interface RecipeSuggestion {
	title: string;
	whyItFits: string;
	wastePreventedNote?: string | null;
	ingredientsToUse: string[];
	ingredientIds?: string[];
	missingIngredients: string[];
	steps: RecipeStep[];
	totalMinutes?: number | null;
	difficulty?: 'easy' | 'medium' | 'hard' | null;
}

const RECIPE_OBJECT_KEYS = new Set([
	'title',
	'whyItFits',
	'wastePreventedNote',
	'ingredientsToUse',
	'ingredientIds',
	'missingIngredients',
	'steps',
	'totalMinutes',
	'difficulty'
]);

export const RECIPE_SUGGESTIONS_SCHEMA = {
	type: 'object',
	properties: {
		recipes: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					whyItFits: { type: 'string' },
					wastePreventedNote: { type: ['string', 'null'] },
					ingredientsToUse: {
						type: 'array',
						items: { type: 'string' }
					},
					ingredientIds: {
						type: 'array',
						items: { type: 'string' }
					},
					missingIngredients: {
						type: 'array',
						items: { type: 'string' }
					},
					totalMinutes: { type: ['number', 'null'] },
					difficulty: { type: ['string', 'null'] },
					steps: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								instruction: { type: 'string' },
								minutes: { type: 'number' }
							},
							required: ['instruction', 'minutes'],
							additionalProperties: false
						}
					}
				},
				required: [
					'title',
					'whyItFits',
					'wastePreventedNote',
					'ingredientsToUse',
					'ingredientIds',
					'missingIngredients',
					'totalMinutes',
					'difficulty',
					'steps'
				],
				additionalProperties: false
			}
		}
	},
	required: ['recipes'],
	additionalProperties: false
} as const;

export function parseRecipeSuggestions(input: unknown): RecipeSuggestion[] {
	if (!input || typeof input !== 'object') {
		return [];
	}

	const recipes = (input as { recipes?: unknown }).recipes;
	if (!Array.isArray(recipes)) {
		return [];
	}

	return recipes
		.map((recipe) => {
			if (!recipe || typeof recipe !== 'object') {
				return null;
			}

			const candidate = recipe as Record<string, unknown>;
			if (Object.keys(candidate).some((key) => !RECIPE_OBJECT_KEYS.has(key))) {
				return null;
			}
			const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
			const whyItFits =
				typeof candidate.whyItFits === 'string' ? candidate.whyItFits.trim() : '';
			const wastePreventedNote =
				typeof candidate.wastePreventedNote === 'string'
					? candidate.wastePreventedNote.trim() || null
					: null;
			const ingredientsToUse = Array.isArray(candidate.ingredientsToUse)
				? candidate.ingredientsToUse.filter((v): v is string => typeof v === 'string')
				: [];
			const ingredientIds = Array.isArray(candidate.ingredientIds)
				? candidate.ingredientIds.filter((v): v is string => typeof v === 'string')
				: [];
			const missingIngredients = Array.isArray(candidate.missingIngredients)
				? candidate.missingIngredients.filter((v): v is string => typeof v === 'string')
				: [];
			const steps = normalizeRecipeSteps(candidate.steps);

			const totalMinutes =
				typeof candidate.totalMinutes === 'number' && Number.isFinite(candidate.totalMinutes)
					? Math.min(480, Math.max(1, Math.round(candidate.totalMinutes)))
					: null;
			const difficulty =
				candidate.difficulty === 'easy' ||
				candidate.difficulty === 'medium' ||
				candidate.difficulty === 'hard'
					? candidate.difficulty
					: null;

			if (!title || !whyItFits || ingredientsToUse.length === 0 || steps.length === 0) {
				return null;
			}

			const parsed: RecipeSuggestion = {
				title,
				whyItFits,
				wastePreventedNote,
				ingredientsToUse,
				ingredientIds: ingredientIds.length > 0 ? ingredientIds : undefined,
				missingIngredients,
				steps,
				totalMinutes,
				difficulty
			};
			return parsed;
		})
		.filter((recipe): recipe is RecipeSuggestion => recipe !== null)
		.slice(0, 4);
}
