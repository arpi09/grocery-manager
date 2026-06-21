import { describe, expect, it } from 'vitest';
import { APP_HOME_PATH, INKOP_PATH } from '$lib/navigation/app-home';
import {
	isFromRecipeAssistant,
	recipeAssistantReturnHref,
	recipeBackHref,
	recipeDetailFromAssistantHref,
	recipeDetailHref
} from './recipe-assistant-nav';

describe('recipe-assistant-nav', () => {
	it('builds detail and return URLs', () => {
		expect(recipeDetailFromAssistantHref('abc-123')).toBe('/recept/abc-123?from=recipe-assistant');
		expect(recipeDetailHref('abc-123', 'planer')).toBe('/recept/abc-123?from=planer');
		expect(recipeDetailHref('abc-123')).toBe('/recept/abc-123');
		expect(recipeAssistantReturnHref()).toBe(`${APP_HOME_PATH}?openRecipeAssistant=1`);
	});

	it('resolves back href from inbound source', () => {
		expect(recipeBackHref('recipe-assistant')).toBe(`${APP_HOME_PATH}?openRecipeAssistant=1`);
		expect(recipeBackHref('planer')).toBe('/planer');
		expect(recipeBackHref('inkop')).toBe(INKOP_PATH);
		expect(recipeBackHref(null)).toBe('/planer');
		expect(recipeBackHref('unknown', '/statistik')).toBe('/statistik');
	});

	it('detects recipe-assistant origin', () => {
		expect(isFromRecipeAssistant('recipe-assistant')).toBe(true);
		expect(isFromRecipeAssistant('hem')).toBe(false);
		expect(isFromRecipeAssistant(null)).toBe(false);
	});
});
