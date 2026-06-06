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
					steps: [
						{ instruction: 'Koka pasta', minutes: 10 },
						{ instruction: 'Blanda sås', minutes: 5 }
					]
				}
			]
		});

		expect(recipes).toHaveLength(1);
		expect(recipes[0]?.title).toBe('Pasta med tomatsås');
		expect(recipes[0]?.steps[0]).toEqual({ instruction: 'Koka pasta', minutes: 10 });
	});

	it('accepts legacy string steps for backward compatibility', () => {
		const recipes = parseRecipeSuggestions({
			recipes: [
				{
					title: 'Soppa',
					whyItFits: 'Tomater',
					ingredientsToUse: ['tomater'],
					missingIngredients: [],
					steps: ['Koka', 'Servera']
				}
			]
		});

		expect(recipes[0]?.steps).toEqual([
			{ instruction: 'Koka' },
			{ instruction: 'Servera' }
		]);
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
						steps: [{ instruction: 'Koka' }]
					}
				]
			})
		).toHaveLength(0);
	});

	it('returns empty for malformed model output', () => {
		expect(parseRecipeSuggestions(null)).toEqual([]);
		expect(parseRecipeSuggestions({ recipes: 'nope' })).toEqual([]);
	});

	it('rejects recipes with hallucinated extra fields', () => {
		expect(
			parseRecipeSuggestions({
				recipes: [
					{
						title: 'Pasta',
						whyItFits: 'Tomater',
						ingredientsToUse: ['pasta'],
						missingIngredients: [],
						steps: [{ instruction: 'Koka' }],
						hallucinatedPantryItem: 'Kycklingfilé'
					}
				]
			})
		).toHaveLength(0);
	});
});
