import { describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { OPENAI_MODEL_NANO } from './openai';
import { generateRecipesWithRefinement, selectVelocityHints } from './recipe-generation';
import type { StructuredJsonResult } from './openai';

const API_KEY = 'test-key';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: '1',
		householdId: 'h1',
		userId: 'u1',
		name: 'Mjölk',
		location: 'fridge',
		quantity: '1',
		unit: 'l',
		expiresOn: '2026-06-03',
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

const draftPayload = {
	recipes: [
		{
			title: 'Pannkaka',
			whyItFits: 'Använder mjölk',
			wastePreventedNote: null,
			ingredientsToUse: ['Mjölk', 'Basilika'],
			missingIngredients: ['Mjöl'],
			totalMinutes: 15,
			difficulty: 'easy',
			steps: [{ instruction: 'Blanda och stek', minutes: 8 }]
		}
	]
};

const refinedPayload = {
	recipes: [
		{
			title: 'Svenska pannkakor',
			whyItFits: 'Passar mjölken som går ut snart',
			wastePreventedNote: 'Räddar mjölken',
			ingredientsToUse: ['Mjölk'],
			missingIngredients: ['Basilika', 'Ägg'],
			totalMinutes: 20,
			difficulty: 'easy',
			steps: [
				{ instruction: 'Vispa 2 dl mjölk med mjöl', minutes: 3 },
				{ instruction: 'Stek tunna pannkakor', minutes: 10 }
			]
		}
	]
};

describe('selectVelocityHints', () => {
	it('keeps rules with enough samples sorted by sample count', () => {
		const hints = selectVelocityHints([
			{ displayName: 'Mjölk', location: 'fridge', typicalDays: 5, sampleCount: 2 },
			{ displayName: 'Falukorv', location: 'fridge', typicalDays: 7, sampleCount: 5 },
			{ displayName: 'Pasta', location: 'cupboard', typicalDays: 90, sampleCount: 4 }
		]);
		expect(hints).toHaveLength(2);
		expect(hints[0]?.displayName).toBe('Falukorv');
	});
});

describe('generateRecipesWithRefinement', () => {
	it('runs draft then refinement and sanitizes against inventory', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult)
			.mockResolvedValueOnce({ ok: true, data: refinedPayload } satisfies StructuredJsonResult);

		const result = await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem()],
				portions: 4,
				mealIntent: 'friday'
			},
			requestJson
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.recipes).toHaveLength(1);
		expect(result.recipes[0]?.title).toBe('Svenska pannkakor');
		expect(result.recipes[0]?.ingredientsToUse).toEqual(['Mjölk']);
		expect(result.recipes[0]?.missingIngredients).toContain('Basilika');
		expect(requestJson).toHaveBeenCalledTimes(2);

		const refineCall = requestJson.mock.calls[1]?.[1];
		expect(refineCall?.systemPrompt).toContain('matredaktör');
		expect(refineCall?.userPrompt).toContain('Utkast att granska');
		expect(refineCall?.model).toBe(OPENAI_MODEL_NANO);
	});

	it('skips refinement for quick intent with small inventory', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult);

		const inventory = Array.from({ length: 10 }, (_, index) =>
			makeItem({ id: String(index + 1), name: `Vara ${index + 1}` })
		);

		const result = await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory,
				portions: 4,
				mealIntent: 'quick'
			},
			requestJson
		);

		expect(result.ok).toBe(true);
		expect(requestJson).toHaveBeenCalledTimes(1);
	});

	it('falls back to sanitized draft when refinement fails', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult)
			.mockResolvedValueOnce({
				ok: false,
				status: 502,
				messageKey: 'errors.api.openAiRequestFailed'
			} satisfies StructuredJsonResult);

		const result = await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem({ name: 'Mjölk' }), makeItem({ id: '2', name: 'Basilika' })],
				portions: 4,
				mealIntent: 'friday'
			},
			requestJson
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.recipes[0]?.ingredientsToUse).toEqual(['Mjölk', 'Basilika']);
	});

	it('passes eat-first structured context to draft and refinement', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult)
			.mockResolvedValueOnce({ ok: true, data: refinedPayload } satisfies StructuredJsonResult);

		await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem({ id: 'exp-1', name: 'Gräddfil', expiresOn: '2026-06-01' })],
				portions: 2,
				mode: 'eat_first',
				expiringItemNames: ['Gräddfil'],
				expiringItems: [makeItem({ id: 'exp-1', name: 'Gräddfil', expiresOn: '2026-06-01' })],
				mealIntent: 'friday'
			},
			requestJson
		);

		const draftUser = requestJson.mock.calls[0]?.[1]?.userPrompt ?? '';
		const refineUser = requestJson.mock.calls[1]?.[1]?.userPrompt ?? '';
		expect(draftUser).toContain('Ät det först');
		expect(draftUser).toContain('"expiringFocus"');
		expect(refineUser).toContain('går ut snart');
		expect(refineUser).toContain('[exp-1] Gräddfil');
	});

	it('passes locale en to system prompt', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult);

		await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: Array.from({ length: 10 }, (_, index) =>
					makeItem({ id: String(index), name: `Item ${index}` })
				),
				portions: 4,
				locale: 'en',
				mealIntent: 'quick'
			},
			requestJson
		);

		expect(requestJson.mock.calls[0]?.[1]?.systemPrompt).toContain('4 portions');
		expect(requestJson.mock.calls[0]?.[1]?.userPrompt).toContain('locale: en-GB');
	});

	it('includes planned meals and avoidTitles in user prompt', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult);

		await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: Array.from({ length: 10 }, (_, index) =>
					makeItem({ id: String(index), name: `Item ${index}` })
				),
				portions: 4,
				mealIntent: 'quick',
				plannedMeals: [
					{
						id: 'm1',
						userId: 'u1',
						title: 'Pasta',
						plannedDate: '2026-06-02',
						notes: null,
						ideaId: null,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				],
				recipeIdeas: [
					{
						id: 'r1',
						userId: 'u1',
						title: 'Kycklingwok',
						whyItFits: 'x',
						ingredientsToUse: ['Kyckling'],
						missingIngredients: [],
						steps: [{ instruction: 'Stek' }],
						createdAt: new Date()
					}
				]
			},
			requestJson
		);

		const draftUser = requestJson.mock.calls[0]?.[1]?.userPrompt ?? '';
		expect(draftUser).toContain('Pasta');
		expect(draftUser).toContain('Kycklingwok');
	});

	it('returns friendly empty when inventory is only non-food', async () => {
		const requestJson = vi.fn();

		const result = await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem({ name: 'Hundmat' }), makeItem({ id: '2', name: 'Rosor' })],
				portions: 4
			},
			requestJson
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.recipes).toEqual([]);
		expect(result.noteKey).toBe('recipe.noSuitableInventoryNote');
		expect(requestJson).not.toHaveBeenCalled();
	});

	it('passes meal intent into draft user prompt', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult)
			.mockResolvedValueOnce({ ok: true, data: refinedPayload } satisfies StructuredJsonResult);

		await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem()],
				portions: 4,
				mealIntent: 'friday'
			},
			requestJson
		);

		expect(requestJson.mock.calls[0]?.[1]?.userPrompt).toContain('fredagsmiddag');
	});

	it('returns error when draft is empty and refinement fails', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: { recipes: [] } } satisfies StructuredJsonResult);

		const result = await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem()],
				portions: 4,
				mealIntent: 'friday'
			},
			requestJson
		);

		expect(result.ok).toBe(false);
	});
});
