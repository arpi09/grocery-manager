import { describe, expect, it } from 'vitest';
import type { InventoryItem } from './inventory-item';
import type { RecipeIdea } from './meal-plan';
import {
	buildHomeBriefingRecipeCard,
	homeBriefingRecipeCtaDestination,
	pickBriefingRecipeIdea
} from './home-briefing-recipe';

const expiringItem: InventoryItem = {
	id: 'item-1',
	householdId: 'hh-1',
	userId: 'user-1',
	name: 'Feta',
	location: 'fridge',
	quantity: '1',
	unit: null,
	expiresOn: '2026-06-20',
	expiresOnSource: null,
	notes: null,
	lastConfirmedAt: new Date('2026-06-01'),
	createdAt: new Date('2026-06-01'),
	updatedAt: new Date('2026-06-01')
};

const idea: RecipeIdea = {
	id: 'idea-1',
	userId: 'user-1',
	title: 'Pasta salad',
	whyItFits: 'Uses feta',
	ingredientsToUse: ['Pasta', 'Feta'],
	missingIngredients: ['Basilika', 'Olivolja'],
	steps: [{ instruction: 'Mix', minutes: 10 }],
	createdAt: new Date('2026-06-18')
};

describe('pickBriefingRecipeIdea', () => {
	it('returns an idea that uses expiring stock', () => {
		expect(pickBriefingRecipeIdea([idea], [expiringItem])).toEqual(idea);
	});

	it('returns null when no idea matches expiring stock', () => {
		const other: RecipeIdea = {
			...idea,
			id: 'idea-2',
			ingredientsToUse: ['Rice']
		};
		expect(pickBriefingRecipeIdea([other], [expiringItem])).toBeNull();
	});
});

describe('buildHomeBriefingRecipeCard', () => {
	it('maps recipe idea fields for briefing presentation', () => {
		const card = buildHomeBriefingRecipeCard(
			idea,
			[expiringItem],
			{ weekday: 5, storeLabel: 'ICA', tripCount: 4 },
			'sv',
			new Date('2026-06-19')
		);

		expect(card).toMatchObject({
			kind: 'recipe',
			ideaId: 'idea-1',
			mealName: 'Pasta salad',
			expiringItemNames: ['Feta'],
			servings: 2,
			missingCount: 2,
			missingIngredients: ['Basilika', 'Olivolja'],
			shopWeekday: 5
		});
		expect(card.expiresWhenLabel).toBeTruthy();
	});
});

describe('homeBriefingRecipeCtaDestination', () => {
	it('routes add-and-shop to shop mode when cadence exists', () => {
		expect(
			homeBriefingRecipeCtaDestination({
				kind: 'recipe',
				ideaId: 'idea-1',
				mealName: 'Pasta salad',
				expiringItemNames: ['Feta'],
				expiresWhenLabel: 'tomorrow',
				servings: 2,
				missingCount: 2,
				missingIngredients: ['Basilika'],
				shopWeekday: 5
			})
		).toBe('/inkop?mode=shop');
	});

	it('routes add-only to plan list', () => {
		expect(
			homeBriefingRecipeCtaDestination({
				kind: 'recipe',
				ideaId: 'idea-1',
				mealName: 'Pasta salad',
				expiringItemNames: ['Feta'],
				expiresWhenLabel: 'tomorrow',
				servings: 2,
				missingCount: 1,
				missingIngredients: ['Basilika'],
				shopWeekday: null
			})
		).toBe('/inkop');
	});
});
