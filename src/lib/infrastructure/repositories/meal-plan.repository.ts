import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { mealPlanTable, recipeIdeaTable } from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';
import type {
	CreatePlannedMealInput,
	CreateRecipeIdeaInput,
	PlannedMeal,
	RecipeIdea,
	UpdatePlannedMealInput
} from '$lib/domain/meal-plan';

export interface IMealPlanRepository {
	listPlannedMealsByRange(userId: string, fromDate: string, toDate: string): Promise<PlannedMeal[]>;
	createPlannedMeal(userId: string, id: string, input: CreatePlannedMealInput): Promise<PlannedMeal>;
	updatePlannedMeal(userId: string, id: string, input: UpdatePlannedMealInput): Promise<PlannedMeal | null>;
	deletePlannedMeal(userId: string, id: string): Promise<boolean>;
	listRecipeIdeas(userId: string, limit: number): Promise<RecipeIdea[]>;
	createRecipeIdeas(userId: string, ideas: CreateRecipeIdeaInput[]): Promise<RecipeIdea[]>;
	getRecipeIdeaById(userId: string, ideaId: string): Promise<RecipeIdea | null>;
}

function parseStringArray(raw: string): string[] {
	try {
		const value = JSON.parse(raw);
		if (!Array.isArray(value)) {
			return [];
		}
		return value.filter((item): item is string => typeof item === 'string');
	} catch {
		return [];
	}
}

function mapPlannedMeal(row: typeof mealPlanTable.$inferSelect): PlannedMeal {
	return {
		id: row.id,
		userId: row.userId,
		title: row.title,
		plannedDate: row.plannedDate,
		notes: row.notes,
		ideaId: row.ideaId,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

function mapRecipeIdea(row: typeof recipeIdeaTable.$inferSelect): RecipeIdea {
	return {
		id: row.id,
		userId: row.userId,
		title: row.title,
		whyItFits: row.whyItFits,
		ingredientsToUse: parseStringArray(row.ingredientsToUse),
		missingIngredients: parseStringArray(row.missingIngredients),
		steps: parseStringArray(row.steps),
		createdAt: row.createdAt
	};
}

export class DrizzleMealPlanRepository implements IMealPlanRepository {
	async listPlannedMealsByRange(userId: string, fromDate: string, toDate: string) {
		const rows = await db
			.select()
			.from(mealPlanTable)
			.where(
				and(
					eq(mealPlanTable.userId, userId),
					gte(mealPlanTable.plannedDate, fromDate),
					lte(mealPlanTable.plannedDate, toDate)
				)
			)
			.orderBy(mealPlanTable.plannedDate, mealPlanTable.createdAt);

		return rows.map(mapPlannedMeal);
	}

	async createPlannedMeal(userId: string, id: string, input: CreatePlannedMealInput) {
		const now = new Date();
		const [row] = await db
			.insert(mealPlanTable)
			.values({
				id,
				userId,
				title: input.title,
				plannedDate: input.plannedDate,
				notes: input.notes ?? null,
				ideaId: input.ideaId ?? null,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return mapPlannedMeal(row);
	}

	async updatePlannedMeal(userId: string, id: string, input: UpdatePlannedMealInput) {
		const [row] = await db
			.update(mealPlanTable)
			.set({
				...(input.title !== undefined && { title: input.title }),
				...(input.plannedDate !== undefined && { plannedDate: input.plannedDate }),
				...(input.notes !== undefined && { notes: input.notes }),
				updatedAt: new Date()
			})
			.where(and(eq(mealPlanTable.id, id), eq(mealPlanTable.userId, userId)))
			.returning();

		return row ? mapPlannedMeal(row) : null;
	}

	async deletePlannedMeal(userId: string, id: string) {
		const rows = await db
			.delete(mealPlanTable)
			.where(and(eq(mealPlanTable.id, id), eq(mealPlanTable.userId, userId)))
			.returning();
		return rows.length > 0;
	}

	async listRecipeIdeas(userId: string, limit: number) {
		const rows = await db
			.select()
			.from(recipeIdeaTable)
			.where(eq(recipeIdeaTable.userId, userId))
			.orderBy(desc(recipeIdeaTable.createdAt))
			.limit(limit);

		return rows.map(mapRecipeIdea);
	}

	async createRecipeIdeas(userId: string, ideas: CreateRecipeIdeaInput[]) {
		if (ideas.length === 0) {
			return [];
		}

		const rows = await db
			.insert(recipeIdeaTable)
			.values(
				ideas.map((idea, index) => ({
					id: generateId(),
					userId,
					title: idea.title,
					whyItFits: idea.whyItFits,
					ingredientsToUse: JSON.stringify(idea.ingredientsToUse),
					missingIngredients: JSON.stringify(idea.missingIngredients),
					steps: JSON.stringify(idea.steps),
					createdAt: new Date(Date.now() + index)
				}))
			)
			.returning();

		return rows.map(mapRecipeIdea);
	}

	async getRecipeIdeaById(userId: string, ideaId: string) {
		const [row] = await db
			.select()
			.from(recipeIdeaTable)
			.where(and(eq(recipeIdeaTable.id, ideaId), eq(recipeIdeaTable.userId, userId)))
			.limit(1);

		return row ? mapRecipeIdea(row) : null;
	}
}
