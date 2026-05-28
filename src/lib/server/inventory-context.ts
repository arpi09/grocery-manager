import type { InventoryItem } from '$lib/domain/inventory-item';
import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function formatInventoryLines(items: InventoryItem[]): string {
	if (items.length === 0) {
		return '(empty inventory)';
	}

	return items
		.map((item) => {
			const unit = item.unit ? ` ${item.unit}` : '';
			const expires = item.expiresOn ? `, expires ${item.expiresOn}` : '';
			const notes = item.notes ? `, notes: ${item.notes}` : '';
			return `- ${item.name}: ${item.quantity}${unit} (${item.location})${expires}${notes}`;
		})
		.join('\n');
}

export function formatPlannedMealLines(meals: PlannedMeal[]): string {
	if (meals.length === 0) {
		return '(no planned meals in range)';
	}

	return meals
		.map((meal) => {
			const notes = meal.notes ? ` — ${meal.notes}` : '';
			return `- ${meal.plannedDate}: ${meal.title}${notes}`;
		})
		.join('\n');
}

export function formatRecipeIdeaLines(ideas: RecipeIdea[]): string {
	if (ideas.length === 0) {
		return '(no saved recipe ideas)';
	}

	return ideas
		.map((idea) => {
			const missing =
				idea.missingIngredients.length > 0
					? `; missing: ${idea.missingIngredients.join(', ')}`
					: '';
			return `- ${idea.title}: use ${idea.ingredientsToUse.join(', ')}${missing}`;
		})
		.join('\n');
}

export function upcomingDateRange(daysAhead: number): { fromDate: string; toDate: string } {
	const from = new Date();
	const to = addDays(from, daysAhead);
	return {
		fromDate: from.toISOString().slice(0, 10),
		toDate: to.toISOString().slice(0, 10)
	};
}
