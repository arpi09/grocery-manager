import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	buildRecipeSystemPrompt,
	buildRecipeUserPrompt,
	buildRecipeRefinementSystemPrompt,
	buildRecipeRefinementUserPrompt,
	clampRecipePortions,
	formatRecipeInventoryLines,
	ingredientMatchesInventory,
	inventoryNameList,
	missingIngredientToListItem,
	parseMissingIngredientsPayload,
	RECIPE_CULINARY_REALISM_RULES,
	mealIntentGuidance,
	resolveIngredientToInventoryName,
	sanitizeRecipeAgainstInventory,
	sanitizeRecipesAgainstInventory
} from './recipe-prompt';
import { filterInventoryForRecipes } from '$lib/domain/recipe-inventory-filter';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: '1',
		householdId: 'h1',
		userId: 'u1',
		name: 'Mjölk',
		location: 'fridge',
		quantity: '1',
		unit: 'l',
		expiresOn: '2026-06-01',
		expiresOnSource: null,
		notes: null,
		lastConfirmedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

describe('clampRecipePortions', () => {
	it('defaults invalid values to 4', () => {
		expect(clampRecipePortions(undefined)).toBe(4);
		expect(clampRecipePortions(NaN)).toBe(4);
	});

	it('clamps to 1–8', () => {
		expect(clampRecipePortions(0)).toBe(1);
		expect(clampRecipePortions(12)).toBe(8);
		expect(clampRecipePortions(3.7)).toBe(4);
	});
});

describe('formatRecipeInventoryLines', () => {
	it('formats Swedish inventory lines with id and expiry', () => {
		const lines = formatRecipeInventoryLines([makeItem({ id: 'inv-mjolk-1' })]);
		expect(lines).toContain('[inv-mjolk-1] Mjölk: 1 l kvar i fridge');
		expect(lines).toContain('typisk måltidsmängd');
		expect(lines).toContain('utgår 2026-06-01');
	});

	it('includes realistic Swedish product names and ids in prompt context', () => {
		const items = [
			makeItem({ id: 'inv-falukorv', name: 'Falukorv', quantity: '400', unit: 'g' }),
			makeItem({ id: 'inv-creme', name: 'Crème fraîche 15%', quantity: '2', unit: 'dl' })
		];
		const lines = formatRecipeInventoryLines(items);
		const user = buildRecipeUserPrompt(lines, 4, '');
		expect(lines).toContain('[inv-falukorv] Falukorv');
		expect(lines).toContain('[inv-creme] Crème fraîche 15%');
		expect(user).toContain('Falukorv');
		expect(user).toContain('enda tillåtna källor');
	});

	it('returns empty marker when no items', () => {
		expect(formatRecipeInventoryLines([])).toBe('(tomt lager)');
	});
});

describe('buildRecipe prompts', () => {
	it('includes portion count and strict inventory rules in system prompt', () => {
		const prompt = buildRecipeSystemPrompt(6);
		expect(prompt).toContain('6 portioner');
		expect(prompt).toContain('ENDA tillåtna källan');
		expect(prompt).toContain('Hitta ALDRIG på varor');
		expect(prompt).toContain('exakta varunamn');
		expect(prompt).toContain('linjärt');
	});

	it('includes structured step rules in system prompt', () => {
		const prompt = buildRecipeSystemPrompt(4);
		expect(prompt).toContain('5–8 steg');
		expect(prompt).toContain('Imperativ svenska');
		expect(prompt).toContain('minutes');
		expect(prompt).toContain('"instruction"');
	});

	it('includes culinary realism constraints in draft and refinement system prompts', () => {
		const draft = buildRecipeSystemPrompt(4);
		const refine = buildRecipeRefinementSystemPrompt(4);

		for (const rule of RECIPE_CULINARY_REALISM_RULES) {
			expect(draft).toContain(rule);
			expect(refine).toContain(rule);
		}

		expect(refine).toContain('baguette med blåbärssylt');
		expect(refine).toContain('frukost, fika, lunch eller middag');
	});

	it('includes portions and preferences in user prompt', () => {
		const user = buildRecipeUserPrompt('- Mjölk: 1 l i fridge', 2, 'vegetariskt');
		expect(user).toContain('Antal portioner: 2');
		expect(user).toContain('Mjölk');
		expect(user).toContain('vegetariskt');
	});

	it('includes meal intent guidance in user prompts', () => {
		const quick = buildRecipeUserPrompt('- Mjölk: 1 l', 4, '', 'quick');
		const friday = buildRecipeUserPrompt('- Mjölk: 1 l', 4, '', 'friday');
		expect(quick).toContain(mealIntentGuidance('quick'));
		expect(friday).toContain('fredagsmiddag');

		const refine = buildRecipeRefinementUserPrompt('{}', '- Mjölk', 4, undefined, 'meal_prep');
		expect(refine).toContain('matlådor');
	});

	it('includes human-food-only rules in culinary realism', () => {
		expect(RECIPE_CULINARY_REALISM_RULES.some((rule) => rule.includes('hundmat'))).toBe(true);
		expect(RECIPE_CULINARY_REALISM_RULES.some((rule) => rule.includes('ignorera'))).toBe(true);
	});
});

describe('buildRecipeRefinement prompts', () => {
	it('includes editor instructions and draft context', () => {
		const system = buildRecipeRefinementSystemPrompt(4);
		expect(system).toContain('matredaktör');
		expect(system).toContain('4 portioner');
		expect(system).toContain('hallucinerade');

		const user = buildRecipeRefinementUserPrompt(
			'{"recipes":[]}',
			'- [id] Mjölk: 1 l',
			4,
			'Prioritera utgående varor'
		);
		expect(user).toContain('Utkast att granska');
		expect(user).toContain('Prioritera utgående varor');
	});
});

describe('ingredientMatchesInventory', () => {
	const names = ['Mjölk', 'Ägg', 'Falukorv'];

	it('matches exact and partial names', () => {
		expect(ingredientMatchesInventory('mjölk', names)).toBe(true);
		expect(ingredientMatchesInventory('ägg', names)).toBe(true);
	});

	it('rejects unknown ingredients', () => {
		expect(ingredientMatchesInventory('basilika', names)).toBe(false);
	});

	it('resolves to canonical inventory spelling', () => {
		expect(resolveIngredientToInventoryName('falukorv', names)).toBe('Falukorv');
		expect(resolveIngredientToInventoryName('Kycklingfilé', names)).toBeNull();
	});
});

describe('sanitizeRecipeAgainstInventory', () => {
	const inventory = inventoryNameList([makeItem({ name: 'Pasta' }), makeItem({ name: 'Tomat' })]);

	it('keeps only inventory-backed ingredients and moves others to missing', () => {
		const sanitized = sanitizeRecipeAgainstInventory(
			{
				title: 'Pasta',
				whyItFits: 'Passar lagret',
				ingredientsToUse: ['Pasta', 'Basilika'],
				missingIngredients: ['Olivolja'],
				steps: [{ instruction: 'Koka pasta' }]
			},
			inventory
		);

		expect(sanitized?.ingredientsToUse).toEqual(['Pasta']);
		expect(sanitized?.missingIngredients).toContain('Basilika');
		expect(sanitized?.missingIngredients).toContain('Olivolja');
	});

	it('maps fuzzy stock names to canonical inventory labels', () => {
		const inventory = inventoryNameList([
			makeItem({ name: 'Falukorv' }),
			makeItem({ name: 'Matlagningsgrädde 15%' })
		]);
		const sanitized = sanitizeRecipeAgainstInventory(
			{
				title: 'Korvstroganoff',
				whyItFits: 'Passar lagret',
				ingredientsToUse: ['falukorv', 'Matlagningsgrädde', 'Lök'],
				missingIngredients: [],
				steps: [{ instruction: 'Stek korv' }]
			},
			inventory
		);

		expect(sanitized?.ingredientsToUse).toEqual(['Falukorv', 'Matlagningsgrädde 15%']);
		expect(sanitized?.missingIngredients).toContain('Lök');
	});

	it('drops recipes with no valid inventory ingredients', () => {
		expect(
			sanitizeRecipeAgainstInventory(
				{
					title: 'X',
					whyItFits: 'Y',
					ingredientsToUse: ['Basilika'],
					missingIngredients: [],
					steps: [{ instruction: 'Steg' }]
				},
				inventory
			)
		).toBeNull();
	});

	it('drops recipes that mention or use non-food inventory', () => {
		const foodInventory = inventoryNameList([makeItem({ name: 'Pasta' }), makeItem({ name: 'Hundmat' })]);
		expect(
			sanitizeRecipeAgainstInventory(
				{
					title: 'Pasta med hundmat',
					whyItFits: 'Nope',
					ingredientsToUse: ['Pasta', 'Hundmat'],
					missingIngredients: [],
					steps: [{ instruction: 'Blanda' }]
				},
				foodInventory
			)
		).toBeNull();

		expect(
			sanitizeRecipeAgainstInventory(
				{
					title: 'Pasta',
					whyItFits: 'OK',
					ingredientsToUse: ['Pasta'],
					missingIngredients: [],
					steps: [{ instruction: 'Servera med rosor' }]
				},
				foodInventory
			)
		).toBeNull();
	});

	it('filterInventoryForRecipes removes non-food before prompts', () => {
		const filtered = filterInventoryForRecipes([
			makeItem({ name: 'Mjölk' }),
			makeItem({ id: '2', name: 'Diskmedel' })
		]);
		expect(filtered).toHaveLength(1);
		expect(filtered[0]?.name).toBe('Mjölk');
	});

	it('sanitizes a list and caps at four', () => {
		const recipes = sanitizeRecipesAgainstInventory(
			[
				{
					title: 'A',
					whyItFits: 'B',
					ingredientsToUse: ['Pasta'],
					missingIngredients: [],
					steps: [{ instruction: '1' }]
				},
				{
					title: 'B',
					whyItFits: 'C',
					ingredientsToUse: ['Lök'],
					missingIngredients: [],
					steps: [{ instruction: '2' }]
				}
			],
			inventory
		);
		expect(recipes).toHaveLength(1);
		expect(recipes[0]?.title).toBe('A');
	});
});

describe('parseMissingIngredientsPayload', () => {
	it('dedupes and trims ingredient names', () => {
		expect(
			parseMissingIngredientsPayload({
				ingredients: ['  Basilika ', 'basilika', '', 3, 'Olivolja']
			})
		).toEqual(['Basilika', 'Olivolja']);
	});
});

describe('missingIngredientToListItem', () => {
	it('creates a shopping list row with default quantity', () => {
		expect(missingIngredientToListItem('Basilika')).toEqual({
			name: 'Basilika',
			quantity: '1',
			unit: 'st'
		});
	});
});
