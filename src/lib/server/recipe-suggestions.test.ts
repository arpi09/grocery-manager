import { describe, expect, it } from 'vitest';
import { parseRecipeSuggestions } from './recipe-suggestions';

describe('parseRecipeSuggestions', () => {
	it('accepts valid structured recipe payloads', () => {
		const recipes = parseRecipeSuggestions({
			recipes: [
				{
					title: 'Pasta med tomatsås',
					whyItFits: 'Använder pasta och tomater som snart går ut.',
					ingredientsToUse: ['pasta', 'tomater'],
					missingIngredients: ['basilika'],
					steps: ['Koka pasta', 'Blanda sås']
				}
			]
		});

		expect(recipes).toHaveLength(1);
		expect(recipes[0]?.title).toBe('Pasta med tomatsås');
	});

	it('rejects recipes missing required content', () => {
		expect(
			parseRecipeSuggestions({
				recipes: [
					{
						title: 'Tomatsoppa',
						whyItFits: 'Tomater',
						ingredientsToUse: [],
						missingIngredients: [],
						steps: ['Koka']
					}
				]
			})
		).toHaveLength(0);
	});

	it('returns empty for malformed model output', () => {
		expect(parseRecipeSuggestions(null)).toEqual([]);
		expect(parseRecipeSuggestions({ recipes: 'nope' })).toEqual([]);
	});
});
