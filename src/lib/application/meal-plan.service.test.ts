import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MealPlanService } from './meal-plan.service';
import type { IMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';
import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';

function makePlannedMeal(overrides: Partial<PlannedMeal> = {}): PlannedMeal {
	return {
		id: 'meal-1',
		userId: 'user-1',
		title: 'Pasta',
		plannedDate: '2026-06-01',
		notes: null,
		ideaId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

function makeRecipeIdea(overrides: Partial<RecipeIdea> = {}): RecipeIdea {
	return {
		id: 'idea-1',
		userId: 'user-1',
		title: 'Quick stir fry',
		whyItFits: 'Uses fridge veg',
		ingredientsToUse: ['carrots'],
		missingIngredients: ['soy sauce'],
		steps: ['Chop', 'Fry'],
		createdAt: new Date(),
		...overrides
	};
}

describe('MealPlanService', () => {
	let repository: IMealPlanRepository;
	let service: MealPlanService;

	beforeEach(() => {
		repository = {
			listPlannedMealsByRange: vi.fn(),
			createPlannedMeal: vi.fn(),
			updatePlannedMeal: vi.fn(),
			deletePlannedMeal: vi.fn(),
			listRecipeIdeas: vi.fn(),
			createRecipeIdeas: vi.fn(),
			getRecipeIdeaById: vi.fn(),
			countRecipeIdeasSince: vi.fn(),
			countPlannedMealsSince: vi.fn(),
			hasAnyPlannedMeal: vi.fn()
		};
		service = new MealPlanService(repository);
	});

	it('lists planned meals in date range', async () => {
		const meals = [makePlannedMeal()];
		vi.mocked(repository.listPlannedMealsByRange).mockResolvedValue(meals);

		const result = await service.listPlannedMealsByRange('user-1', '2026-06-01', '2026-06-30');

		expect(result).toEqual(meals);
		expect(repository.listPlannedMealsByRange).toHaveBeenCalledWith(
			'user-1',
			'2026-06-01',
			'2026-06-30'
		);
	});

	it('creates a planned meal', async () => {
		const meal = makePlannedMeal({ title: 'Tacos' });
		vi.mocked(repository.createPlannedMeal).mockResolvedValue(meal);

		const result = await service.createPlannedMeal('user-1', {
			title: 'Tacos',
			plannedDate: '2026-06-01'
		});

		expect(result.title).toBe('Tacos');
		expect(repository.createPlannedMeal).toHaveBeenCalledWith(
			'user-1',
			expect.any(String),
			expect.objectContaining({ title: 'Tacos', plannedDate: '2026-06-01' })
		);
	});

	it('updates a planned meal', async () => {
		const meal = makePlannedMeal({ title: 'Updated pasta' });
		vi.mocked(repository.updatePlannedMeal).mockResolvedValue(meal);

		const result = await service.updatePlannedMeal('user-1', 'meal-1', { title: 'Updated pasta' });

		expect(result.title).toBe('Updated pasta');
	});

	it('deletes a planned meal', async () => {
		vi.mocked(repository.deletePlannedMeal).mockResolvedValue(true);

		await service.deletePlannedMeal('user-1', 'meal-1');

		expect(repository.deletePlannedMeal).toHaveBeenCalledWith('user-1', 'meal-1');
	});

	it('lists recipe ideas', async () => {
		const ideas = [makeRecipeIdea()];
		vi.mocked(repository.listRecipeIdeas).mockResolvedValue(ideas);

		const result = await service.listRecipeIdeas('user-1', 5);

		expect(result).toEqual(ideas);
		expect(repository.listRecipeIdeas).toHaveBeenCalledWith('user-1', 5);
	});

	it('stores generated recipe ideas', async () => {
		const ideas = [makeRecipeIdea()];
		vi.mocked(repository.createRecipeIdeas).mockResolvedValue(ideas);

		const input = [
			{
				title: 'Quick stir fry',
				whyItFits: 'Uses fridge veg',
				ingredientsToUse: ['carrots'],
				missingIngredients: ['soy sauce'],
				steps: ['Chop', 'Fry']
			}
		];

		const result = await service.storeGeneratedIdeas('user-1', input);

		expect(result).toEqual(ideas);
		expect(repository.createRecipeIdeas).toHaveBeenCalledWith('user-1', input);
	});

	it('creates a planned meal from a recipe idea', async () => {
		const idea = makeRecipeIdea();
		const meal = makePlannedMeal({
			title: idea.title,
			notes: idea.whyItFits,
			ideaId: idea.id,
			plannedDate: '2026-06-15'
		});
		vi.mocked(repository.getRecipeIdeaById).mockResolvedValue(idea);
		vi.mocked(repository.createPlannedMeal).mockResolvedValue(meal);

		const result = await service.createPlannedMealFromIdea('user-1', 'idea-1', '2026-06-15');

		expect(result.ideaId).toBe('idea-1');
		expect(repository.createPlannedMeal).toHaveBeenCalledWith('user-1', expect.any(String), {
			title: idea.title,
			plannedDate: '2026-06-15',
			notes: idea.whyItFits,
			ideaId: idea.id
		});
	});
});
