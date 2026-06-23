import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	buildInventoryInsightsPrompts,
	buildPhotoRoundPrompts,
	buildProductFromImagePrompts,
	buildRecipeCookPrompts,
	buildWeeklyPlanPromptSnapshot,
	getPromptVersion
} from '$lib/server/ai-prompts';
import {
	PROMPT_VERSION_PHOTO_ROUND,
	PROMPT_VERSION_PRODUCT_FROM_IMAGE,
	PROMPT_VERSION_RECIPE_COOK,
	PROMPT_VERSION_WEEKLY_PLAN
} from '$lib/server/ai-prompt-shared';

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
		lastConfirmedAt: new Date('2026-06-01'),
		createdAt: new Date('2026-06-01'),
		updatedAt: new Date('2026-06-01'),
		...overrides
	};
}

describe('ai-prompt payload snapshots', () => {
	it('photo-round v3 includes brand fields and multi-photo context', () => {
		const payload = buildPhotoRoundPrompts('fridge', 2);
		expect(payload.version).toBe(PROMPT_VERSION_PHOTO_ROUND);
		expect(payload.systemPrompt).toContain('photo-round-v3');
		expect(payload.systemPrompt).toContain('brand');
		expect(payload.systemPrompt).toContain('categoryHint');
		expect(payload.userPrompt).toContain('"photoIndex":1');
		expect(payload.userPrompt).toContain('"totalPhotos":2');
		expect(payload.userPrompt).toContain('"zoneHint":"fridge"');
	});

	it('product-from-image includes location hint and normalizedKey', () => {
		const payload = buildProductFromImagePrompts('sv', 'cupboard');
		expect(payload.version).toBe(PROMPT_VERSION_PRODUCT_FROM_IMAGE);
		expect(payload.systemPrompt).toContain('normalizedKey');
		expect(JSON.parse(payload.userPrompt)).toMatchObject({
			locationHint: 'cupboard',
			storageHint: 'skafferi'
		});
	});

	it('inventory insights v3 user prompt includes heuristic baseline', () => {
		const payload = buildInventoryInsightsPrompts([makeItem()], 'sv');
		expect(payload.userPrompt).toContain('Heuristic snapshot');
		expect(payload.userPrompt).toContain('inventory-insights-v3');
		expect(getPromptVersion('insights')).toBe('inventory-insights-v3');
	});

	it('recipe-cook and weekly-plan registry versions', () => {
		expect(getPromptVersion('recipe-cook')).toBe(PROMPT_VERSION_RECIPE_COOK);
		expect(getPromptVersion('weekly-plan')).toBe(PROMPT_VERSION_WEEKLY_PLAN);
		const cookPayload = buildRecipeCookPrompts(
			{ title: 'Test', ingredientsToUse: ['Mjölk'] },
			[makeItem()]
		);
		expect(cookPayload.version).toBe('recipe-cook-v1');
		const weeklySnapshot = buildWeeklyPlanPromptSnapshot();
		expect(weeklySnapshot.version).toBe('weekly-plan-v1');
		expect(weeklySnapshot.systemPrompt).toContain('recipe-v4');
	});
});
