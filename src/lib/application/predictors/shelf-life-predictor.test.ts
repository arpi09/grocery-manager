import { describe, expect, it, vi } from 'vitest';
import { ShelfLifePredictor } from '$lib/application/predictors/shelf-life-predictor';
import type { HouseholdLearningPort } from '$lib/application/learning/ports/household-learning.port';

function createHouseholdPort(
	rules: Record<string, { typicalDays: number; sampleCount: number } | null> = {}
): HouseholdLearningPort {
	return {
		findShelfLifeRule: vi.fn(async (_householdId, normalizedKey, location) => {
			const key = `${normalizedKey}:${location}`;
			return rules[key] ?? null;
		}),
		upsertShelfLifeRule: vi.fn(async () => {}),
		findLocationRule: vi.fn(async () => null),
		upsertLocationRule: vi.fn(async () => {})
	};
}

describe('ShelfLifePredictor', () => {
	const householdId = 'house-1';
	const ctx = { householdId };

	it('uses heuristic when learning is disabled', async () => {
		const predictor = new ShelfLifePredictor(createHouseholdPort(), {
			learningEnabled: () => false,
			todayIso: () => '2026-06-01'
		});

		const result = await predictor.predict(ctx, {
			productName: 'Mjölk 3%',
			normalizedKey: 'mjolk 3',
			location: 'fridge',
			purchasedAt: '2026-06-01'
		});

		expect(result).not.toBeNull();
		expect(result?.source).toBe('heuristic');
		expect(result?.modelVersion).toBe('heuristic-v1');
		expect(result?.value.expiresOn).toBe('2026-06-08');
		expect(result?.value.typicalDays).toBe(7);
		expect(result?.explain).toBe('Typisk hållbarhet för liknande varor');
	});

	it('uses household rule with low confidence at one sample', async () => {
		const predictor = new ShelfLifePredictor(
			createHouseholdPort({ 'mjolk:fridge': { typicalDays: 5, sampleCount: 1 } }),
			{
				learningEnabled: () => true,
				todayIso: () => '2026-06-01'
			}
		);

		const result = await predictor.predict(ctx, {
			productName: 'Mjölk',
			normalizedKey: 'mjolk',
			location: 'fridge',
			purchasedAt: '2026-06-01'
		});

		expect(result?.source).toBe('household_rule');
		expect(result?.confidence).toBe(0.55);
	});

	it('skips household tier when no rule exists', async () => {
		const predictor = new ShelfLifePredictor(createHouseholdPort(), {
			learningEnabled: () => true,
			todayIso: () => '2026-06-01'
		});

		const result = await predictor.predict(ctx, {
			productName: 'Mjölk',
			normalizedKey: 'mjolk',
			location: 'fridge',
			purchasedAt: '2026-06-01'
		});

		expect(result?.source).toBe('heuristic');
	});

	it('uses household rule when learning enabled and enough samples', async () => {
		const predictor = new ShelfLifePredictor(
			createHouseholdPort({ 'mjolk:fridge': { typicalDays: 9, sampleCount: 3 } }),
			{
				learningEnabled: () => true,
				todayIso: () => '2026-06-01'
			}
		);

		const result = await predictor.predict(ctx, {
			productName: 'Mjölk',
			normalizedKey: 'mjolk',
			location: 'fridge',
			purchasedAt: '2026-06-01'
		});

		expect(result).toMatchObject({
			source: 'household_rule',
			modelVersion: 'household-v1',
			explain: 'Ca 9 dagars hållbarhet',
			value: {
				typicalDays: 9,
				expiresOn: '2026-06-10'
			}
		});
	});

	it('returns location default for unknown products without heuristic match', async () => {
		const predictor = new ShelfLifePredictor(createHouseholdPort(), {
			learningEnabled: () => false,
			todayIso: () => '2026-06-01'
		});

		const fridge = await predictor.predict(ctx, {
			productName: 'Xyzzq unknown product',
			normalizedKey: 'xyzzq unknown product',
			location: 'fridge',
			purchasedAt: '2026-06-01'
		});
		const freezer = await predictor.predict(ctx, {
			productName: 'Xyzzq unknown product',
			normalizedKey: 'xyzzq unknown product',
			location: 'freezer',
			purchasedAt: '2026-06-01'
		});
		const cupboard = await predictor.predict(ctx, {
			productName: 'Xyzzq unknown product',
			normalizedKey: 'xyzzq unknown product',
			location: 'cupboard',
			purchasedAt: '2026-06-01'
		});

		expect(fridge).toMatchObject({
			source: 'location_default',
			value: { typicalDays: 5, expiresOn: '2026-06-06' }
		});
		expect(freezer).toMatchObject({
			source: 'location_default',
			value: { typicalDays: 90, expiresOn: '2026-08-30' }
		});
		expect(cupboard).toMatchObject({
			source: 'location_default',
			value: { typicalDays: 60, expiresOn: '2026-07-31' }
		});
	});
});
