import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import type { RecipeIdea } from '$lib/domain/meal-plan';
import { dedupeMissingIngredients } from '$lib/utils/recipe-add-missing';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';

export interface WeeklyMealAssignment {
	ideaId: string;
	plannedDate: string;
}

export interface ApproveWeeklyRitualResult {
	mealsScheduled: number;
	listAdded: number;
	listSkipped: number;
}

export class WeeklyRitualReadOnlyError extends Error {
	constructor() {
		super('readonly');
	}
}

export class WeeklyRitualService {
	constructor(
		private readonly mealPlanService: MealPlanService,
		private readonly shoppingListService: ShoppingListService
	) {}

	async approveWeek(
		userId: string,
		householdId: string,
		role: HouseholdRole,
		assignments: WeeklyMealAssignment[],
		ideasById: Map<string, RecipeIdea>,
		addMissingToList: boolean
	): Promise<ApproveWeeklyRitualResult> {
		if (!canEditInventory(role)) {
			throw new WeeklyRitualReadOnlyError();
		}

		let mealsScheduled = 0;
		const missingLists: string[][] = [];

		for (const assignment of assignments) {
			const idea = ideasById.get(assignment.ideaId);
			if (!idea) {
				continue;
			}

			await this.mealPlanService.createPlannedMealFromIdea(
				userId,
				assignment.ideaId,
				assignment.plannedDate
			);
			mealsScheduled += 1;

			if (addMissingToList && idea.missingIngredients.length > 0) {
				missingLists.push(idea.missingIngredients);
			}
		}

		let listAdded = 0;
		let listSkipped = 0;

		if (addMissingToList && missingLists.length > 0) {
			const ingredients = dedupeMissingIngredients(missingLists);
			if (ingredients.length > 0) {
				const result = await this.shoppingListService.addSuggestedItems(
					householdId,
					role,
					ingredients.map((name) => ({ name }))
				);
				listAdded = result.added;
				listSkipped = result.skipped;
			}
		}

		return {
			mealsScheduled,
			listAdded,
			listSkipped
		};
	}
}
