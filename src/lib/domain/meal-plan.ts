import type { RecipeStep } from '$lib/domain/recipe';

export interface RecipeIdea {
	id: string;
	userId: string;
	title: string;
	whyItFits: string;
	ingredientsToUse: string[];
	missingIngredients: string[];
	steps: RecipeStep[];
	createdAt: Date;
}

export interface PlannedMeal {
	id: string;
	userId: string;
	title: string;
	plannedDate: string;
	notes: string | null;
	ideaId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreatePlannedMealInput {
	title: string;
	plannedDate: string;
	notes?: string | null;
	ideaId?: string | null;
}

export interface UpdatePlannedMealInput {
	title?: string;
	plannedDate?: string;
	notes?: string | null;
}

export interface CreateRecipeIdeaInput {
	title: string;
	whyItFits: string;
	ingredientsToUse: string[];
	missingIngredients: string[];
	steps: RecipeStep[];
}
