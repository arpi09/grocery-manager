import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	FEATURE_FLAG_ENV,
	getAllFeatureFlagSnapshot,
	isBrainFeedbackV1Enabled,
	isHomeRedesignV1Enabled,
	isLocationLearningEnabled,
	isPriceMemoryV1Enabled,
	isReplenishmentLearningEnabled,
	isShelfLifeLearningEnabled,
	isShoppingListShareEnabled,
	isShoppingUxV2Enabled,
	isPantryUxV2Enabled,
	isHomeUxV2Enabled,
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
		expect(FEATURE_FLAG_ENV.HOME_REDESIGN_V1).toBe('HOME_REDESIGN_V1_ENABLED');
		expect(FEATURE_FLAG_ENV.SHOPPING_UX_V2).toBe('SHOPPING_UX_V2_ENABLED');
		expect(FEATURE_FLAG_ENV.PANTRY_UX_V2).toBe('PANTRY_UX_V2_ENABLED');
		expect(FEATURE_FLAG_ENV.HOME_UX_V2).toBe('HOME_UX_V2_ENABLED');
		expect(FEATURE_FLAG_ENV.STORE_RECOMMENDATION_V0).toBe('STORE_RECOMMENDATION_V0_ENABLED');
	});

	it('defaults brain learning flags on when unset; other flags off', () => {
		expect(isShelfLifeLearningEnabled()).toBe(true);
		expect(isLocationLearningEnabled()).toBe(true);
		expect(isReplenishmentLearningEnabled()).toBe(true);
		expect(isBrainFeedbackV1Enabled()).toBe(true);
		expect(isHomeUxV2Enabled()).toBe(true);
		expect(isHomeBriefingAiEnabled()).toBe(true);
		expect(isReplenishmentRankEnabled()).toBe(true);
		expect(isPriceMemoryV1Enabled()).toBe(false);
		expect(isShoppingListShareEnabled()).toBe(false);
		expect(isHomeRedesignV1Enabled()).toBe(false);
		expect(isShoppingUxV2Enabled()).toBe(false);
		expect(isPantryUxV2Enabled()).toBe(false);
		expect(isStoreRecommendationV0Enabled()).toBe(false);
	});

	it('disables default-on brain flags when env is false', () => {
		process.env[FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING] = 'false';
		process.env[FEATURE_FLAG_ENV.HOME_UX_V2] = 'false';
		expect(isShelfLifeLearningEnabled()).toBe(false);
		expect(isHomeUxV2Enabled()).toBe(false);
	});

	it('enables opt-in flags only when env is exactly true', () => {
		process.env[FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING] = 'true';
		process.env[FEATURE_FLAG_ENV.LOCATION_LEARNING] = 'true';
		process.env[FEATURE_FLAG_ENV.REPLENISHMENT_LEARNING] = 'true';
		process.env[FEATURE_FLAG_ENV.PRICE_MEMORY_V1] = 'true';
		process.env[FEATURE_FLAG_ENV.BRAIN_FEEDBACK_V1] = 'true';
		process.env[FEATURE_FLAG_ENV.SHOPPING_LIST_SHARE] = 'true';
		process.env[FEATURE_FLAG_ENV.HOME_REDESIGN_V1] = 'true';
		process.env[FEATURE_FLAG_ENV.SHOPPING_UX_V2] = 'true';
		process.env[FEATURE_FLAG_ENV.PANTRY_UX_V2] = 'true';
		process.env[FEATURE_FLAG_ENV.HOME_UX_V2] = 'true';
		process.env[FEATURE_FLAG_ENV.STORE_RECOMMENDATION_V0] = 'true';

		expect(isShelfLifeLearningEnabled()).toBe(true);
		expect(isLocationLearningEnabled()).toBe(true);
		expect(isReplenishmentLearningEnabled()).toBe(true);
		expect(isPriceMemoryV1Enabled()).toBe(true);
		expect(isBrainFeedbackV1Enabled()).toBe(true);
		expect(isShoppingListShareEnabled()).toBe(true);
		expect(isHomeRedesignV1Enabled()).toBe(true);
		expect(isShoppingUxV2Enabled()).toBe(true);
		expect(isPantryUxV2Enabled()).toBe(true);
		expect(isHomeUxV2Enabled()).toBe(true);
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

		process.env[FEATURE_FLAG_ENV.SHOPPING_UX_V2] = 'true';
		const shopping = getAllFeatureFlagSnapshot().find((entry) => entry.id === 'shoppingUxV2');
		expect(shopping?.effective).toBe(true);
		expect(shopping?.source).toBe('env');
		expect(shopping?.envValue).toBe('true');
	});
});
