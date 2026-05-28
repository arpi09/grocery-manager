import { generateId } from '$lib/infrastructure/auth/id';
import type {
	CreatePlannedMealInput,
	CreateRecipeIdeaInput,
	UpdatePlannedMealInput
} from '$lib/domain/meal-plan';
import type { IMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';

export class MealPlanNotFoundError extends Error {
	constructor() {
		super('Planned meal not found');
		this.name = 'MealPlanNotFoundError';
	}
}

export class RecipeIdeaNotFoundError extends Error {
	constructor() {
		super('Recipe idea not found');
		this.name = 'RecipeIdeaNotFoundError';
	}
}

export class MealPlanService {
	constructor(private readonly repository: IMealPlanRepository) {}

	async listPlannedMealsByRange(userId: string, fromDate: string, toDate: string) {
		return this.repository.listPlannedMealsByRange(userId, fromDate, toDate);
	}

	async createPlannedMeal(userId: string, input: CreatePlannedMealInput) {
		return this.repository.createPlannedMeal(userId, generateId(), input);
	}

	async updatePlannedMeal(userId: string, id: string, input: UpdatePlannedMealInput) {
		const meal = await this.repository.updatePlannedMeal(userId, id, input);
		if (!meal) {
			throw new MealPlanNotFoundError();
		}
		return meal;
	}

	async deletePlannedMeal(userId: string, id: string) {
		const deleted = await this.repository.deletePlannedMeal(userId, id);
		if (!deleted) {
			throw new MealPlanNotFoundError();
		}
	}

	async listRecipeIdeas(userId: string, limit = 12) {
		return this.repository.listRecipeIdeas(userId, limit);
	}

	async storeGeneratedIdeas(userId: string, ideas: CreateRecipeIdeaInput[]) {
		return this.repository.createRecipeIdeas(userId, ideas);
	}

	async createPlannedMealFromIdea(userId: string, ideaId: string, plannedDate: string) {
		const idea = await this.repository.getRecipeIdeaById(userId, ideaId);
		if (!idea) {
			throw new RecipeIdeaNotFoundError();
		}

		return this.repository.createPlannedMeal(userId, generateId(), {
			title: idea.title,
			plannedDate,
			notes: idea.whyItFits,
			ideaId: idea.id
		});
	}
}
