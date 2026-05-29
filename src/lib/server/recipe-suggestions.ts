export interface RecipeSuggestion {
	title: string;
	whyItFits: string;
	ingredientsToUse: string[];
	missingIngredients: string[];
	steps: string[];
}

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
						items: { type: 'string' }
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
			const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
			const whyItFits =
				typeof candidate.whyItFits === 'string' ? candidate.whyItFits.trim() : '';
			const ingredientsToUse = Array.isArray(candidate.ingredientsToUse)
				? candidate.ingredientsToUse.filter((v): v is string => typeof v === 'string')
				: [];
			const missingIngredients = Array.isArray(candidate.missingIngredients)
				? candidate.missingIngredients.filter((v): v is string => typeof v === 'string')
				: [];
			const steps = Array.isArray(candidate.steps)
				? candidate.steps.filter((v): v is string => typeof v === 'string')
				: [];

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
