/**
 * Central registry of server-side feature flag env reads.
 * Domain-specific *-flag.ts modules re-export for backward-compatible imports.
 */
export const FEATURE_FLAG_ENV = {
	SHELF_LIFE_LEARNING: 'SHELF_LIFE_LEARNING_ENABLED',
	PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT: 'PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT',
	LOCATION_LEARNING: 'LOCATION_LEARNING_ENABLED',
	REPLENISHMENT_LEARNING: 'REPLENISHMENT_LEARNING_ENABLED',
	HOME_REDESIGN_V1: 'HOME_REDESIGN_V1_ENABLED',
	PRICE_MEMORY_V1: 'PRICE_MEMORY_V1_ENABLED',
	BRAIN_FEEDBACK_V1: 'BRAIN_FEEDBACK_V1_ENABLED',
	SHOPPING_LIST_SHARE: 'PUBLIC_SHOPPING_LIST_SHARE_ENABLED',
	SHOPPING_UX_V2: 'SHOPPING_UX_V2_ENABLED',
	PANTRY_UX_V2: 'PANTRY_UX_V2_ENABLED',
	HOME_UX_V2: 'HOME_UX_V2_ENABLED',
	RECEIPT_AI_BATCH: 'RECEIPT_AI_BATCH_ENABLED',
	AUTO_FINISH: 'AUTO_FINISH_ENABLED',
	GLOBAL_SHELF_LIFE_DB: 'GLOBAL_SHELF_LIFE_DB_ENABLED',
	STORE_RECOMMENDATION_V0: 'STORE_RECOMMENDATION_V0_ENABLED'
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

/** Server flag: Home premium redesign v5 layout (default off). */
export function isHomeRedesignV1Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.HOME_REDESIGN_V1);
}

/** Server flag: Brain Feedback V1 UI (belief line, teaching chips, inline ack). */
export function isBrainFeedbackV1Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.BRAIN_FEEDBACK_V1);
}

/** Kill switch for W1 public shopping list share (create UI + API). */
export function isShoppingListShareEnabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.SHOPPING_LIST_SHARE);
}

/** Server flag: Price Memory V1 read surfaces (default off). */
export function isPriceMemoryV1Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.PRICE_MEMORY_V1);
}

/** Server flag: Shopping UX v2 — plan + shop modes on `/inkop` (default off). */
export function isShoppingUxV2Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.SHOPPING_UX_V2);
}

/** Server flag: Pantry UX v2 — shelf view on `/inventory` (default off). */
export function isPantryUxV2Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.PANTRY_UX_V2);
}

/** Server flag: Home UX v2 — Household Briefing on `/hem` (default off). */
export function isHomeUxV2Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.HOME_UX_V2);
}

/** Server flag: Store recommendation V0 learning experiment (default off). */
export function isStoreRecommendationV0Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.STORE_RECOMMENDATION_V0);
}

/** Server flag: OpenAI shelf-life batch fallback on receipt parse (default on). */
export function isReceiptAiBatchEnabled(): boolean {
	return process.env[FEATURE_FLAG_ENV.RECEIPT_AI_BATCH] !== 'false';
}

/** Server flag: auto-finish items in expired section after grace (default off). */
export function isAutoFinishEnabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.AUTO_FINISH);
}

/** Server flag: expanded global shelf-life keyword DB (default on). */
export function isGlobalShelfLifeDbEnabled(): boolean {
	return process.env[FEATURE_FLAG_ENV.GLOBAL_SHELF_LIFE_DB] !== 'false';
}
