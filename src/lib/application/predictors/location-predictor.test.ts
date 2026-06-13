import { describe, expect, it, vi } from 'vitest';
import { LocationPredictor } from '$lib/application/predictors/location-predictor';
import type { HouseholdLearningPort } from '$lib/application/learning/ports/household-learning.port';

function createHouseholdPort(
	rules: Record<string, { location: 'fridge' | 'freezer' | 'cupboard'; sampleCount: number } | null> = {}
): HouseholdLearningPort {
	return {
		findShelfLifeRule: vi.fn(async () => null),
		upsertShelfLifeRule: vi.fn(async () => {}),
		findLocationRule: vi.fn(async (_householdId, normalizedKey) => {
			return rules[normalizedKey] ?? null;
		}),
		upsertLocationRule: vi.fn(async () => {})
	};
}

describe('LocationPredictor', () => {
	const householdId = 'house-1';
	const ctx = { householdId };

	it('uses heuristic when learning is disabled', async () => {
		const predictor = new LocationPredictor(createHouseholdPort(), {
			learningEnabled: () => false
		});

		const result = await predictor.predict(ctx, {
			productName: 'Mjölk 3%',
			normalizedKey: 'mjolk 3'
		});

		expect(result).toMatchObject({
			source: 'heuristic',
			value: { location: 'fridge' }
		});
	});

	it('skips household tier when sample count is below threshold', async () => {
		const predictor = new LocationPredictor(
			createHouseholdPort({ pasta: { location: 'cupboard', sampleCount: 1 } }),
			{ learningEnabled: () => true }
		);

		const result = await predictor.predict(ctx, {
			productName: 'Pasta Spaghetti',
			normalizedKey: 'pasta'
		});

		expect(result?.source).toBe('heuristic');
	});

	it('uses household rule when learning enabled and enough samples', async () => {
		const predictor = new LocationPredictor(
			createHouseholdPort({ pasta: { location: 'cupboard', sampleCount: 3 } }),
			{ learningEnabled: () => true }
		);

		const result = await predictor.predict(ctx, {
			productName: 'Pasta Spaghetti',
			normalizedKey: 'pasta'
		});

		expect(result).toMatchObject({
			source: 'household_rule',
			value: { location: 'cupboard' }
		});
	});
});
