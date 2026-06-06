import { describe, expect, it } from 'vitest';
import { normalizeRecipeSteps, totalMinutes } from './recipe';

describe('normalizeRecipeSteps', () => {
	it('maps legacy string[] to RecipeStep[]', () => {
		expect(normalizeRecipeSteps(['Koka pasta', 'Servera'])).toEqual([
			{ instruction: 'Koka pasta' },
			{ instruction: 'Servera' }
		]);
	});

	it('accepts structured steps with minutes', () => {
		expect(
			normalizeRecipeSteps([
				{ instruction: 'Hacka löken', minutes: 3 },
				{ instruction: 'Stek korv', minutes: 8 }
			])
		).toEqual([
			{ instruction: 'Hacka löken', minutes: 3 },
			{ instruction: 'Stek korv', minutes: 8 }
		]);
	});

	it('clamps minutes to 1–120', () => {
		expect(normalizeRecipeSteps([{ instruction: 'Vila', minutes: 200 }])).toEqual([
			{ instruction: 'Vila', minutes: 120 }
		]);
	});
});

describe('totalMinutes', () => {
	it('sums step minutes when present', () => {
		expect(
			totalMinutes([
				{ instruction: 'A', minutes: 5 },
				{ instruction: 'B', minutes: 10 }
			])
		).toBe(15);
	});

	it('returns null when no steps have minutes', () => {
		expect(totalMinutes([{ instruction: 'A' }, { instruction: 'B' }])).toBeNull();
	});
});
