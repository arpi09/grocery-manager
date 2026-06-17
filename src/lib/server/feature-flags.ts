/**
 * Central registry of server-side feature flag env reads.
 * Domain-specific *-flag.ts modules re-export for backward-compatible imports.
 */
export const FEATURE_FLAG_ENV = {
	SHELF_LIFE_LEARNING: 'SHELF_LIFE_LEARNING_ENABLED',
	PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT: 'PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT',
	LOCATION_LEARNING: 'LOCATION_LEARNING_ENABLED',
	REPLENISHMENT_LEARNING: 'REPLENISHMENT_LEARNING_ENABLED',
	PRICE_MEMORY_V1: 'PRICE_MEMORY_V1_ENABLED',
	SHOPPING_LIST_SHARE: 'PUBLIC_SHOPPING_LIST_SHARE_ENABLED'
} as const;

function isEnvTrue(key: string): boolean {
	return process.env[key] === 'true';
}

/** Server flag: household shelf-life learning (default off). */
export function isShelfLifeLearningEnabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING);
}

/** Server flag: household location learning (default off). */
export function isLocationLearningEnabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.LOCATION_LEARNING);
}

/** Server flag: replenishment accept/dismiss feedback log (default off). */
export function isReplenishmentLearningEnabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.REPLENISHMENT_LEARNING);
}

/** Kill switch for W1 public shopping list share (create UI + API). */
export function isShoppingListShareEnabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.SHOPPING_LIST_SHARE);
}

/** Server flag: Price Memory V1 read surfaces (default off). */
export function isPriceMemoryV1Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.PRICE_MEMORY_V1);
}
