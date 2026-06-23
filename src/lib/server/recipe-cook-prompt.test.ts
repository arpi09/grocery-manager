import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	buildRecipeCookSystemPrompt,
	buildRecipeCookUserPrompt,
	parseRecipeCookResponse,
	RECIPE_COOK_SCHEMA
} from '$lib/server/recipe-cook-prompt';
import { buildRecipeCookPrompts } from '$lib/server/ai-prompts';
import { PROMPT_VERSION_RECIPE_COOK } from '$lib/server/ai-prompt-shared';
import { getPromptVersion } from '$lib/server/ai-prompts';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: 'inv-1',
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
		lastConfirmedAt: new Date('2026-06-01'),
		createdAt: new Date('2026-06-01'),
		updatedAt: new Date('2026-06-01'),
		...overrides
	};
}

describe('recipe-cook-prompt v1', () => {
	it('registry exposes recipe-cook-v1', () => {
		expect(getPromptVersion('recipe-cook')).toBe(PROMPT_VERSION_RECIPE_COOK);
		expect(PROMPT_VERSION_RECIPE_COOK).toBe('recipe-cook-v1');
	});

	it('system prompt includes version and consume presets', () => {
		const prompt = buildRecipeCookSystemPrompt('sv');
		expect(prompt).toContain('recipe-cook-v1');
		expect(prompt).toContain('lite');
		expect(prompt).toContain('half');
		expect(prompt).toContain('all');
	});

	it('user prompt includes recipe title and inventory lines', () => {
		const prompt = buildRecipeCookUserPrompt(
			{
				title: 'Pasta carbonara',
				ingredientsToUse: ['Pasta', 'Bacon'],
				ingredientIds: ['inv-2'],
				portions: 4
			},
			[makeItem({ id: 'inv-2', name: 'Pasta' })]
		);
		expect(prompt).toContain('Pasta carbonara');
		expect(prompt).toContain('- Pasta');
		expect(prompt).toContain('inv-2');
	});

	it('buildRecipeCookPrompts returns registry payload', () => {
		const payload = buildRecipeCookPrompts(
			{ title: 'Soppa', ingredientsToUse: ['Morot'] },
			[makeItem({ id: 'inv-3', name: 'Morot' })]
		);
		expect(payload.version).toBe('recipe-cook-v1');
		expect(payload.systemPrompt).toContain('recipe-cook-v1');
		expect(payload.userPrompt).toContain('Soppa');
	});

	it('parseRecipeCookResponse validates inventory ids and presets', () => {
		const validIds = new Set(['inv-1', 'inv-2']);
		const parsed = parseRecipeCookResponse(
			{
				matches: [
					{
						inventoryId: 'inv-1',
						ingredientName: 'Mjölk',
						consumePreset: 'half',
						customAmount: null
					},
					{
						inventoryId: 'unknown',
						ingredientName: 'Hallon',
						consumePreset: 'all',
						customAmount: null
					},
					{
						inventoryId: 'inv-2',
						ingredientName: 'Pasta',
						consumePreset: 'bogus',
						customAmount: '100'
					}
				],
				skipped: [{ ingredientName: 'Salt', reason: 'not tracked' }]
			},
			validIds
		);

		expect(parsed.matches).toHaveLength(2);
		expect(parsed.matches[0]?.consumePreset).toBe('half');
		expect(parsed.matches[1]?.consumePreset).toBe('half');
		expect(parsed.matches[1]?.customAmount).toBe('100');
		expect(parsed.skipped[0]?.ingredientName).toBe('Salt');
	});

	it('schema requires matches and skipped arrays', () => {
		expect(RECIPE_COOK_SCHEMA.required).toEqual(['matches', 'skipped']);
	});
});
