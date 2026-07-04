import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	FEATURE_FLAG_ENV,
	getAllFeatureFlagSnapshot,
	isBrainFeedbackV1Enabled,
	isLocationLearningEnabled,
	isPriceMemoryV1Enabled,
	isReplenishmentLearningEnabled,
	isShelfLifeLearningEnabled,
	isShoppingListShareEnabled,
	isHomeBriefingAiEnabled,
	isReplenishmentRankEnabled,
	isStoreRecommendationV0Enabled
} from './feature-flags';

describe('feature-flags registry', () => {
	const envKeys = Object.values(FEATURE_FLAG_ENV);
	const original: Record<string, string | undefined> = {};

	beforeEach(() => {
		for (const key of envKeys) {
			original[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterEach(() => {
		for (const key of envKeys) {
			if (original[key] === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = original[key];
			}
		}
	});

	it('exposes all server flag env keys', () => {
		expect(FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING).toBe('SHELF_LIFE_LEARNING_ENABLED');
		expect(FEATURE_FLAG_ENV.LOCATION_LEARNING).toBe('LOCATION_LEARNING_ENABLED');
		expect(FEATURE_FLAG_ENV.REPLENISHMENT_LEARNING).toBe('REPLENISHMENT_LEARNING_ENABLED');
		expect(FEATURE_FLAG_ENV.PRICE_MEMORY_V1).toBe('PRICE_MEMORY_V1_ENABLED');
		expect(FEATURE_FLAG_ENV.BRAIN_FEEDBACK_V1).toBe('BRAIN_FEEDBACK_V1_ENABLED');
		expect(FEATURE_FLAG_ENV.SHOPPING_LIST_SHARE).toBe('PUBLIC_SHOPPING_LIST_SHARE_ENABLED');
		expect(FEATURE_FLAG_ENV.STORE_RECOMMENDATION_V0).toBe('STORE_RECOMMENDATION_V0_ENABLED');
	});

	it('defaults brain learning flags on when unset; other flags off', () => {
		expect(isShelfLifeLearningEnabled()).toBe(true);
		expect(isLocationLearningEnabled()).toBe(true);
		expect(isReplenishmentLearningEnabled()).toBe(true);
		expect(isBrainFeedbackV1Enabled()).toBe(true);
		expect(isHomeBriefingAiEnabled()).toBe(true);
		expect(isReplenishmentRankEnabled()).toBe(true);
		expect(isPriceMemoryV1Enabled()).toBe(false);
		expect(isShoppingListShareEnabled()).toBe(false);
		expect(isStoreRecommendationV0Enabled()).toBe(false);
	});

	it('disables default-on brain flags when env is false', () => {
		process.env[FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING] = 'false';
		expect(isShelfLifeLearningEnabled()).toBe(false);
	});

	it('enables opt-in flags only when env is exactly true', () => {
		process.env[FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING] = 'true';
		process.env[FEATURE_FLAG_ENV.LOCATION_LEARNING] = 'true';
		process.env[FEATURE_FLAG_ENV.REPLENISHMENT_LEARNING] = 'true';
		process.env[FEATURE_FLAG_ENV.PRICE_MEMORY_V1] = 'true';
		process.env[FEATURE_FLAG_ENV.BRAIN_FEEDBACK_V1] = 'true';
		process.env[FEATURE_FLAG_ENV.SHOPPING_LIST_SHARE] = 'true';
		process.env[FEATURE_FLAG_ENV.STORE_RECOMMENDATION_V0] = 'true';

		expect(isShelfLifeLearningEnabled()).toBe(true);
		expect(isLocationLearningEnabled()).toBe(true);
		expect(isReplenishmentLearningEnabled()).toBe(true);
		expect(isPriceMemoryV1Enabled()).toBe(true);
		expect(isBrainFeedbackV1Enabled()).toBe(true);
		expect(isShoppingListShareEnabled()).toBe(true);
		expect(isStoreRecommendationV0Enabled()).toBe(true);

		process.env[FEATURE_FLAG_ENV.PRICE_MEMORY_V1] = 'false';
		expect(isPriceMemoryV1Enabled()).toBe(false);
	});

	it('getAllFeatureFlagSnapshot lists every registry flag with source metadata', () => {
		const snapshot = getAllFeatureFlagSnapshot();
		expect(snapshot).toHaveLength(Object.keys(FEATURE_FLAG_ENV).length);
		for (const entry of snapshot) {
			expect(entry.envKey).toBeTruthy();
			expect(typeof entry.effective).toBe('boolean');
			expect(['env', 'default']).toContain(entry.source);
		}

		process.env[FEATURE_FLAG_ENV.PRICE_MEMORY_V1] = 'true';
		const priceMemory = getAllFeatureFlagSnapshot().find((entry) => entry.id === 'priceMemoryV1');
		expect(priceMemory?.effective).toBe(true);
		expect(priceMemory?.source).toBe('env');
		expect(priceMemory?.envValue).toBe('true');
	});
});
