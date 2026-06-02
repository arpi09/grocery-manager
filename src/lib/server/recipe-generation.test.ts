import { describe, expect, it, vi } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { generateRecipesWithRefinement } from './recipe-generation';
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
		notes: null,
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
			ingredientsToUse: ['Mjölk', 'Basilika'],
			missingIngredients: ['Mjöl'],
			steps: ['Blanda och stek']
		}
	]
};

const refinedPayload = {
	recipes: [
		{
			title: 'Svenska pannkakor',
			whyItFits: 'Passar mjölken som går ut snart',
			ingredientsToUse: ['Mjölk'],
			missingIngredients: ['Basilika', 'Ägg'],
			steps: ['Vispa 2 dl mjölk med mjöl', 'Stek tunna pannkakor']
		}
	]
};

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
				portions: 4
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
				portions: 4
			},
			requestJson
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}
		expect(result.recipes[0]?.ingredientsToUse).toEqual(['Mjölk', 'Basilika']);
	});

	it('passes eat-first context to both passes', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: draftPayload } satisfies StructuredJsonResult)
			.mockResolvedValueOnce({ ok: true, data: refinedPayload } satisfies StructuredJsonResult);

		await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem({ name: 'Gräddfil' })],
				portions: 2,
				mode: 'eat_first',
				expiringItemNames: ['Gräddfil']
			},
			requestJson
		);

		const draftUser = requestJson.mock.calls[0]?.[1]?.userPrompt ?? '';
		const refineUser = requestJson.mock.calls[1]?.[1]?.userPrompt ?? '';
		expect(draftUser).toContain('Ät det först');
		expect(refineUser).toContain('går ut snart');
	});

	it('returns error when draft is empty and refinement fails', async () => {
		const requestJson = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, data: { recipes: [] } } satisfies StructuredJsonResult);

		const result = await generateRecipesWithRefinement(
			{
				apiKey: API_KEY,
				inventory: [makeItem()],
				portions: 4
			},
			requestJson
		);

		expect(result.ok).toBe(false);
	});
});
