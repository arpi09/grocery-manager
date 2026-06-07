import { describe, expect, it } from 'vitest';
import {
	isFromRecipeAssistant,
	recipeAssistantReturnHref,
	recipeDetailFromAssistantHref
} from './recipe-assistant-nav';

describe('recipe-assistant-nav', () => {
	it('builds detail and return URLs', () => {
		expect(recipeDetailFromAssistantHref('abc-123')).toBe('/recept/abc-123?from=recipe-assistant');
		expect(recipeAssistantReturnHref()).toBe('/hem?openRecipeAssistant=1');
	});

	it('detects recipe-assistant origin', () => {
		expect(isFromRecipeAssistant('recipe-assistant')).toBe(true);
		expect(isFromRecipeAssistant('hem')).toBe(false);
		expect(isFromRecipeAssistant(null)).toBe(false);
	});
});
