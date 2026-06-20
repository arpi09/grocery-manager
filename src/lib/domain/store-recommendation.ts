export const STORE_CHAIN_IDS = ['ica', 'coop', 'willys', 'lidl', 'hemkop', 'citygross'] as const;

export type StoreChainId = (typeof STORE_CHAIN_IDS)[number];

export const STORE_PREFERENCE_IDS = [
	'lowestPrice',
	'closest',
	'fewestStores',
	'sameChain'
] as const;

export type StorePreferenceId = (typeof STORE_PREFERENCE_IDS)[number];

export type StoreRecommendationSource = 'home' | 'inkop_plan' | 'direct';

export interface StoreRecommendationState {
	preference: StorePreferenceId | null;
	chains: StoreChainId[];
	compareIca: boolean | null;
}

export const STORE_RECOMMENDATION_COMPLETED_KEY = 'store-recommendation-v0-completed';

export function isValidStorePreference(value: string): value is StorePreferenceId {
	return (STORE_PREFERENCE_IDS as readonly string[]).includes(value);
}

export function isValidStoreChain(value: string): value is StoreChainId {
	return (STORE_CHAIN_IDS as readonly string[]).includes(value);
}

export function parseStoreRecommendationSource(value: string | null): StoreRecommendationSource {
	if (value === 'home' || value === 'inkop_plan') {
		return value;
	}
	return 'direct';
}

export function isStoreRecommendationComplete(state: StoreRecommendationState): boolean {
	return (
		state.preference !== null && state.chains.length > 0 && state.compareIca !== null
	);
}
