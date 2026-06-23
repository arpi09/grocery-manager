import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { PROMPT_VERSION_RECIPE } from '$lib/server/ai-prompt-shared';
import { formatStructuredInventoryPayload } from '$lib/server/inventory-context';
import {
	buildRecipeContextPayload,
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
		expiresOnSource: 'household_learned',
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

function makePromptContext(items: InventoryItem[], overrides: Record<string, unknown> = {}) {
	const inventoryPayload = formatStructuredInventoryPayload(items, 'sv', { portions: 4 });
	return {
		locale: 'sv',
		portions: 4,
		mealIntent: 'quick' as const,
		inventoryPayload,
		preferences: '',
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

describe('formatStructuredInventoryPayload', () => {
	it('includes id, daysUntilExpiry and expiresOnSource', () => {
		const payload = formatStructuredInventoryPayload(
			[makeItem({ id: 'inv-mjolk-1', expiresOn: '2026-06-01', expiresOnSource: 'household_learned' })],
			'sv',
			{ portions: 4 }
		);
		expect(payload.inventory[0]).toMatchObject({
			id: 'inv-mjolk-1',
			name: 'Mjölk',
			expiresOnSource: 'household_learned'
		});
		expect(payload.inventory[0]?.daysUntilExpiry).toBeTypeOf('number');
		expect(payload.inventory[0]?.purchasedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(payload.inventory[0]?.daysSincePurchase).toBeTypeOf('number');
	});

	it('sorts by urgency and caps with truncated suffix', () => {
		const items = Array.from({ length: 42 }, (_, index) =>
			makeItem({
				id: `item-${index}`,
				name: `Vara ${index}`,
				expiresOn: `2026-07-${String((index % 28) + 1).padStart(2, '0')}`
			})
		);
		const payload = formatStructuredInventoryPayload(items, 'sv', { cap: 40, portions: 4 });
		expect(payload.inventory).toHaveLength(40);
		expect(payload.truncated?.omittedCount).toBe(2);
		expect(payload.truncated?.note).toContain('lägst urgency');
	});
});

describe('formatRecipeInventoryLines', () => {
	it('formats Swedish inventory lines with id and expiry', () => {
		const lines = formatRecipeInventoryLines([makeItem({ id: 'inv-mjolk-1' })]);
		expect(lines).toContain('[inv-mjolk-1] Mjölk: 1 l kvar i fridge');
		expect(lines).toContain('typisk måltidsmängd');
		expect(lines).toContain('utgår 2026-06-01');
		expect(lines).toContain('källa: household_learned');
	});

	it('returns empty marker when no items', () => {
		expect(formatRecipeInventoryLines([])).toBe('(tomt lager)');
	});
});

describe('buildRecipe prompts', () => {
	it('includes portion count and strict inventory rules in system prompt', () => {
		const prompt = buildRecipeSystemPrompt(6);
		expect(prompt).toContain('6 portioner');
		expect(prompt).toContain('inventory');
		expect(prompt).toContain('Hitta ALDRIG på varor');
		expect(prompt).toContain('totalMinutes');
		expect(prompt).toContain('difficulty');
		expect(prompt).toContain(`promptVersion: ${PROMPT_VERSION_RECIPE}`);
	});

	it('uses English when locale is en', () => {
		const prompt = buildRecipeSystemPrompt(4, 'en');
		expect(prompt).toContain('4 portions');
		expect(prompt).toContain('en-GB');
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

	it('includes ingredientIds and household context in system prompt', () => {
		const prompt = buildRecipeSystemPrompt(4);
		expect(prompt).toContain('ingredientIds');
		expect(prompt).toContain(PROMPT_VERSION_RECIPE);
	});

	it('uses stronger draft-only rules when requested', () => {
		const prompt = buildRecipeSystemPrompt(4, 'sv', { draftOnly: true });
		expect(prompt).toContain('En-pass-läge');
	});

	it('requires expiring focus ids in eat-first mode', () => {
		const prompt = buildRecipeSystemPrompt(4, 'en', { requireExpiringFocus: true });
		expect(prompt).toContain('expiringFocus.id');
	});

	it('includes householdSize and recentlyFinished in context payload', () => {
		const payload = buildRecipeContextPayload(
			makePromptContext([makeItem()], {
				householdSize: 3,
				recentlyFinished: ['Pasta carbonara']
			})
		);
		expect(payload.householdSize).toBe(3);
		expect(payload.recentlyFinished).toEqual(['Pasta carbonara']);
	});

	it('builds recipe-v4 JSON user prompt with inventory and preferences', () => {
		const items = [
			makeItem({ id: 'inv-falukorv', name: 'Falukorv', quantity: '400', unit: 'g' }),
			makeItem({ id: 'inv-creme', name: 'Crème fraîche 15%', quantity: '2', unit: 'dl' })
		];
		const context = makePromptContext(items, { preferences: 'vegetariskt' });
		const user = buildRecipeUserPrompt(context);
		expect(user).toContain(`promptVersion: ${PROMPT_VERSION_RECIPE}`);
		expect(user).toContain('locale: sv-SE');
		expect(user).toContain('Falukorv');
		expect(user).toContain('vegetariskt');
		expect(user).toContain('"inventory"');
	});

	it('includes planned meals and avoidTitles in context payload', () => {
		const payload = buildRecipeContextPayload(
			makePromptContext([makeItem()], {
				plannedMeals: [{ date: '2026-06-02', title: 'Pasta' }],
				avoidTitles: ['Kycklingwok']
			})
		);
		expect(payload.plannedMeals).toEqual([{ date: '2026-06-02', title: 'Pasta' }]);
		expect(payload.avoidTitles).toEqual(['Kycklingwok']);
	});

	it('includes meal intent guidance in user prompts', () => {
		const quick = buildRecipeUserPrompt(makePromptContext([makeItem()], { mealIntent: 'quick' }));
		const friday = buildRecipeUserPrompt(makePromptContext([makeItem()], { mealIntent: 'friday' }));
		expect(quick).toContain(mealIntentGuidance('quick'));
		expect(friday).toContain('fredagsmiddag');

		const refine = buildRecipeRefinementUserPrompt(
			'{}',
			makePromptContext([makeItem()], { mealIntent: 'meal_prep', locale: 'en' }),
			'Prioritize expiring items'
		);
		expect(refine).toContain('meal prep');
		expect(refine).toContain('locale: en-GB');
		expect(refine).toContain('Prioritize expiring items');
		expect(refine).toContain('"inventory"');
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
			makePromptContext([makeItem()]),
			'Prioritera utgående varor'
		);
		expect(user).toContain('Utkast att granska');
		expect(user).toContain('Prioritera utgående varor');
		expect(user).toContain('"inventory"');
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
