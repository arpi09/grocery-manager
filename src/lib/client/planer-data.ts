import type { RecipeIdea } from '$lib/domain/meal-plan';

export async function fetchMealPlanIdeas(limit?: number): Promise<RecipeIdea[]> {
	const search = new URLSearchParams();
	if (limit !== undefined) {
		search.set('limit', String(limit));
	}

	const query = search.size > 0 ? `?${search}` : '';
	const response = await fetch(`/api/planer/ideas${query}`);
	if (!response.ok) {
		throw new Error(`Meal plan ideas request failed (${response.status})`);
	}

	const body = (await response.json()) as { ideas: RecipeIdea[] };
	return body.ideas;
}

export async function dismissMealPlanIdea(ideaId: string): Promise<void> {
	const response = await fetch('/api/planer/ideas/dismiss', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ideaId })
	});

	if (!response.ok) {
		throw new Error(`Dismiss recipe idea failed (${response.status})`);
	}
}
