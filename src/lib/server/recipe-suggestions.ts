import { normalizeRecipeSteps, type RecipeStep } from '$lib/domain/recipe';

export interface RecipeSuggestion {
	title: string;
	whyItFits: string;
	ingredientsToUse: string[];
	missingIngredients: string[];
	steps: RecipeStep[];
}

const RECIPE_OBJECT_KEYS = new Set([
	'title',
	'whyItFits',
	'ingredientsToUse',
	'missingIngredients',
	'steps'
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
					ingredientsToUse: {
						type: 'array',
						items: { type: 'string' }
					},
					missingIngredients: {
						type: 'array',
						items: { type: 'string' }
					},
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
				required: ['title', 'whyItFits', 'ingredientsToUse', 'missingIngredients', 'steps'],
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
			const ingredientsToUse = Array.isArray(candidate.ingredientsToUse)
				? candidate.ingredientsToUse.filter((v): v is string => typeof v === 'string')
				: [];
			const missingIngredients = Array.isArray(candidate.missingIngredients)
				? candidate.missingIngredients.filter((v): v is string => typeof v === 'string')
				: [];
			const steps = normalizeRecipeSteps(candidate.steps);

			if (!title || !whyItFits || ingredientsToUse.length === 0 || steps.length === 0) {
				return null;
			}

			return {
				title,
				whyItFits,
				ingredientsToUse,
				missingIngredients,
				steps
			};
		})
		.filter((recipe): recipe is RecipeSuggestion => recipe !== null)
		.slice(0, 4);
}
