import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WeeklyRitualReadOnlyError, WeeklyRitualService } from './weekly-ritual.service';
import type { MealPlanService } from './meal-plan.service';
import type { ShoppingListService } from './shopping-list.service';
import type { RecipeIdea } from '$lib/domain/meal-plan';

const ideaFixture = (id: string, missing: string[] = []): RecipeIdea => ({
	id,
	userId: 'user-1',
	title: `Meal ${id}`,
	whyItFits: 'Uses expiring items',
	ingredientsToUse: ['Mjölk'],
	missingIngredients: missing,
	steps: ['Cook'],
	createdAt: new Date('2026-06-01')
});

describe('WeeklyRitualService', () => {
	let mealPlanService: MealPlanService;
	let shoppingListService: ShoppingListService;
	let service: WeeklyRitualService;

	beforeEach(() => {
		mealPlanService = {
			createPlannedMealFromIdea: vi.fn().mockResolvedValue({
				id: 'meal-1',
				userId: 'user-1',
				title: 'Meal',
				plannedDate: '2026-06-02',
				notes: null,
				ideaId: 'idea-1',
				createdAt: new Date(),
				updatedAt: new Date()
			})
		} as unknown as MealPlanService;
		shoppingListService = {
			addSuggestedItems: vi.fn().mockResolvedValue({ added: 2, skipped: 1 })
		} as unknown as ShoppingListService;
		service = new WeeklyRitualService(mealPlanService, shoppingListService);
	});

	it('rejects viewers', async () => {
		await expect(
			service.approveWeek('user-1', 'house-1', 'viewer', [], new Map(), false)
		).rejects.toBeInstanceOf(WeeklyRitualReadOnlyError);
	});

	it('schedules meals and skips unknown idea ids', async () => {
		const ideasById = new Map([
			['idea-1', ideaFixture('idea-1')],
			['idea-2', ideaFixture('idea-2')]
		]);

		const result = await service.approveWeek(
			'user-1',
			'house-1',
			'editor',
			[
				{ ideaId: 'idea-1', plannedDate: '2026-06-02' },
				{ ideaId: 'missing', plannedDate: '2026-06-03' },
				{ ideaId: 'idea-2', plannedDate: '2026-06-04' }
			],
			ideasById,
			false
		);

		expect(result).toEqual({ mealsScheduled: 2, listAdded: 0, listSkipped: 0 });
		expect(mealPlanService.createPlannedMealFromIdea).toHaveBeenCalledTimes(2);
		expect(shoppingListService.addSuggestedItems).not.toHaveBeenCalled();
	});

	it('dedupes missing ingredients onto the shopping list when requested', async () => {
		const ideasById = new Map([
			['idea-1', ideaFixture('idea-1', ['Lök', 'Tomat'])],
			['idea-2', ideaFixture('idea-2', ['lök', 'Basilika'])]
		]);

		const result = await service.approveWeek(
			'user-1',
			'house-1',
			'owner',
			[
				{ ideaId: 'idea-1', plannedDate: '2026-06-02' },
				{ ideaId: 'idea-2', plannedDate: '2026-06-03' }
			],
			ideasById,
			true
		);

		expect(result).toEqual({ mealsScheduled: 2, listAdded: 2, listSkipped: 1 });
		expect(shoppingListService.addSuggestedItems).toHaveBeenCalledWith('house-1', 'owner', [
			{ name: 'Lök' },
			{ name: 'Tomat' },
			{ name: 'Basilika' }
		]);
	});
});
