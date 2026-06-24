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
	STORE_RECOMMENDATION_V0: 'STORE_RECOMMENDATION_V0_ENABLED',
	RECIPE_REFINEMENT: 'RECIPE_REFINEMENT_ENABLED',
	PHOTO_VALIDATION: 'PHOTO_VALIDATION_ENABLED',
	HOME_BRIEFING_AI: 'HOME_BRIEFING_AI_ENABLED',
	REPLENISHMENT_RANK: 'REPLENISHMENT_RANK_ENABLED',
	BRAIN_PROACTIVE: 'BRAIN_PROACTIVE_ENABLED'
} as const;

function isEnvTrue(key: string): boolean {
	return process.env[key] === 'true';
}

function isEnvEnabledDefaultOn(key: string): boolean {
	return process.env[key] !== 'false';
}

/** Server flag: household shelf-life learning (default on). */
export function isShelfLifeLearningEnabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING);
}

/** Client receipt UX — explicit PUBLIC_* or fallback to server learning flag. */
export function isPublicShelfLifeEstimatesInReceiptEnabled(): boolean {
	const explicit = process.env[FEATURE_FLAG_ENV.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT];
	if (explicit !== undefined && explicit !== '') {
		return explicit === 'true';
	}
	return isShelfLifeLearningEnabled();
}

/** Server flag: household location learning (default on). */
export function isLocationLearningEnabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.LOCATION_LEARNING);
}

/** Server flag: replenishment accept/dismiss feedback log (default on). */
export function isReplenishmentLearningEnabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.REPLENISHMENT_LEARNING);
}

/** Server flag: Home premium redesign v5 layout (default off). */
export function isHomeRedesignV1Enabled(): boolean {
	return isEnvTrue(FEATURE_FLAG_ENV.HOME_REDESIGN_V1);
}

/** Server flag: Brain Feedback V1 UI (belief line, teaching chips, inline ack). Default on. */
export function isBrainFeedbackV1Enabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.BRAIN_FEEDBACK_V1);
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

/** Server flag: Home UX v2 — Household Briefing on `/hem` (default on). */
export function isHomeUxV2Enabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.HOME_UX_V2);
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

/** Server flag: second LLM refinement pass for recipe generation (default on). */
export function isRecipeRefinementEnabled(): boolean {
	return process.env[FEATURE_FLAG_ENV.RECIPE_REFINEMENT] !== 'false';
}

/** Server flag: second-pass photo-round validation LLM (default on). */
export function isPhotoValidationEnabled(): boolean {
	return process.env[FEATURE_FLAG_ENV.PHOTO_VALIDATION] !== 'false';
}

/** Server flag: nano home briefing one-liner on `/hem` (default on). */
export function isHomeBriefingAiEnabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.HOME_BRIEFING_AI);
}

/** Server flag: nano rank top replenishment suggestions (default on). */
export function isReplenishmentRankEnabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.REPLENISHMENT_RANK);
}

/** Server flag: proactive brain automation — briefing/pre-shop/partner/Kivra (default on). */
export function isBrainProactiveEnabled(): boolean {
	return isEnvEnabledDefaultOn(FEATURE_FLAG_ENV.BRAIN_PROACTIVE);
}

export type FeatureFlagPattern = 'exactTrue' | 'defaultOn' | 'notFalse';

export type FeatureFlagSource = 'env' | 'default';

export type FeatureFlagSnapshotEntry = {
	id: string;
	envKey: string;
	label: string;
	pattern: FeatureFlagPattern;
	codeDefault: boolean;
	envValue: string | null;
	source: FeatureFlagSource;
	effective: boolean;
};

function codeDefaultForPattern(pattern: FeatureFlagPattern): boolean {
	if (pattern === 'exactTrue') {
		return false;
	}
	return true;
}

function readEnvSource(envKey: string): { envValue: string | null; source: FeatureFlagSource } {
	const raw = process.env[envKey];
	if (raw === undefined || raw === '') {
		return { envValue: null, source: 'default' };
	}
	return { envValue: raw, source: 'env' };
}

/** Read-only snapshot of all server feature flags for admin diagnostics. */
export function getAllFeatureFlagSnapshot(): FeatureFlagSnapshotEntry[] {
	const registry: Array<{
		id: string;
		envKey: string;
		label: string;
		pattern: FeatureFlagPattern;
		check: () => boolean;
	}> = [
		{
			id: 'shelfLifeLearning',
			envKey: FEATURE_FLAG_ENV.SHELF_LIFE_LEARNING,
			label: 'Shelf life learning',
			pattern: 'defaultOn',
			check: isShelfLifeLearningEnabled
		},
		{
			id: 'publicShelfLifeEstimatesInReceipt',
			envKey: FEATURE_FLAG_ENV.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT,
			label: 'Public shelf-life estimates in receipt (PUBLIC or fallback)',
			pattern: 'defaultOn',
			check: isPublicShelfLifeEstimatesInReceiptEnabled
		},
		{
			id: 'locationLearning',
			envKey: FEATURE_FLAG_ENV.LOCATION_LEARNING,
			label: 'Location learning',
			pattern: 'defaultOn',
			check: isLocationLearningEnabled
		},
		{
			id: 'replenishmentLearning',
			envKey: FEATURE_FLAG_ENV.REPLENISHMENT_LEARNING,
			label: 'Replenishment learning',
			pattern: 'defaultOn',
			check: isReplenishmentLearningEnabled
		},
		{
			id: 'homeRedesignV1',
			envKey: FEATURE_FLAG_ENV.HOME_REDESIGN_V1,
			label: 'Home redesign v1',
			pattern: 'exactTrue',
			check: isHomeRedesignV1Enabled
		},
		{
			id: 'brainFeedbackV1',
			envKey: FEATURE_FLAG_ENV.BRAIN_FEEDBACK_V1,
			label: 'Brain feedback v1',
			pattern: 'defaultOn',
			check: isBrainFeedbackV1Enabled
		},
		{
			id: 'shoppingListShare',
			envKey: FEATURE_FLAG_ENV.SHOPPING_LIST_SHARE,
			label: 'Public shopping list share',
			pattern: 'exactTrue',
			check: isShoppingListShareEnabled
		},
		{
			id: 'priceMemoryV1',
			envKey: FEATURE_FLAG_ENV.PRICE_MEMORY_V1,
			label: 'Price memory v1',
			pattern: 'exactTrue',
			check: isPriceMemoryV1Enabled
		},
		{
			id: 'shoppingUxV2',
			envKey: FEATURE_FLAG_ENV.SHOPPING_UX_V2,
			label: 'Shopping UX v2',
			pattern: 'exactTrue',
			check: isShoppingUxV2Enabled
		},
		{
			id: 'pantryUxV2',
			envKey: FEATURE_FLAG_ENV.PANTRY_UX_V2,
			label: 'Pantry UX v2',
			pattern: 'exactTrue',
			check: isPantryUxV2Enabled
		},
		{
			id: 'homeUxV2',
			envKey: FEATURE_FLAG_ENV.HOME_UX_V2,
			label: 'Home UX v2',
			pattern: 'defaultOn',
			check: isHomeUxV2Enabled
		},
		{
			id: 'storeRecommendationV0',
			envKey: FEATURE_FLAG_ENV.STORE_RECOMMENDATION_V0,
			label: 'Store recommendation v0',
			pattern: 'exactTrue',
			check: isStoreRecommendationV0Enabled
		},
		{
			id: 'receiptAiBatch',
			envKey: FEATURE_FLAG_ENV.RECEIPT_AI_BATCH,
			label: 'Receipt AI batch',
			pattern: 'notFalse',
			check: isReceiptAiBatchEnabled
		},
		{
			id: 'autoFinish',
			envKey: FEATURE_FLAG_ENV.AUTO_FINISH,
			label: 'Auto finish expired',
			pattern: 'exactTrue',
			check: isAutoFinishEnabled
		},
		{
			id: 'globalShelfLifeDb',
			envKey: FEATURE_FLAG_ENV.GLOBAL_SHELF_LIFE_DB,
			label: 'Global shelf-life DB',
			pattern: 'notFalse',
			check: isGlobalShelfLifeDbEnabled
		},
		{
			id: 'recipeRefinement',
			envKey: FEATURE_FLAG_ENV.RECIPE_REFINEMENT,
			label: 'Recipe refinement',
			pattern: 'notFalse',
			check: isRecipeRefinementEnabled
		},
		{
			id: 'photoValidation',
			envKey: FEATURE_FLAG_ENV.PHOTO_VALIDATION,
			label: 'Photo validation',
			pattern: 'notFalse',
			check: isPhotoValidationEnabled
		},
		{
			id: 'homeBriefingAi',
			envKey: FEATURE_FLAG_ENV.HOME_BRIEFING_AI,
			label: 'Home briefing AI',
			pattern: 'defaultOn',
			check: isHomeBriefingAiEnabled
		},
		{
			id: 'replenishmentRank',
			envKey: FEATURE_FLAG_ENV.REPLENISHMENT_RANK,
			label: 'Replenishment rank',
			pattern: 'defaultOn',
			check: isReplenishmentRankEnabled
		},
		{
			id: 'brainProactive',
			envKey: FEATURE_FLAG_ENV.BRAIN_PROACTIVE,
			label: 'Brain proactive',
			pattern: 'defaultOn',
			check: isBrainProactiveEnabled
		}
	];

	return registry.map(({ check, pattern, ...rest }) => {
		const { envValue, source } = readEnvSource(rest.envKey);
		return {
			...rest,
			pattern,
			codeDefault: codeDefaultForPattern(pattern),
			envValue,
			source,
			effective: check()
		};
	});
}
