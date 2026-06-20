import { trackProductEvent } from '$lib/client/product-events';
import type {
	StoreChainId,
	StorePreferenceId,
	StoreRecommendationSource
} from '$lib/domain/store-recommendation';

export function trackStoreRecommendationOpened(source: StoreRecommendationSource): void {
	void trackProductEvent('store_recommendation_opened', { source });
}

export function trackStorePreferenceSelected(preference: StorePreferenceId): void {
	void trackProductEvent('store_preference_selected', { preference });
}

export function trackStoreChainSelected(chains: StoreChainId[]): void {
	void trackProductEvent('store_chain_selected', { chains });
}

export function trackStoreCompareIcaEnabled(enabled: boolean): void {
	void trackProductEvent('store_compare_ica_enabled', { enabled });
}

export function trackStoreRecommendationInterestShown(): void {
	void trackProductEvent('store_recommendation_interest_shown');
}

export function trackStoreRecommendationCompleted(metadata: {
	preference: StorePreferenceId;
	chains: StoreChainId[];
	compareIca: boolean;
}): void {
	void trackProductEvent('store_recommendation_completed', metadata);
}
