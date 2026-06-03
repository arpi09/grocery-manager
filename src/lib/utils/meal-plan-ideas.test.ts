import { describe, expect, it } from 'vitest';
import type { RecipeIdea } from '$lib/domain/meal-plan';
import { ideasByIdFromList } from './meal-plan-ideas';

function makeIdea(id: string, missing: string[] = []): RecipeIdea {
	return {
		id,
		userId: 'user-1',
		title: `Idea ${id}`,
		whyItFits: 'fits',
		ingredientsToUse: ['pasta'],
		missingIngredients: missing,
		steps: ['Cook'],
		createdAt: new Date('2026-01-01')
	};
}

describe('ideasByIdFromList', () => {
	it('maps ideas by id for calendar lookups', () => {
		const map = ideasByIdFromList([
			makeIdea('a', ['salt']),
			makeIdea('b', ['pepper'])
		]);
		expect(map.a?.missingIngredients).toEqual(['salt']);
		expect(map.b?.title).toBe('Idea b');
	});
});
