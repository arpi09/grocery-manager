import { describe, expect, it } from 'vitest';
import {
	isStoreRecommendationComplete,
	isValidStoreChain,
	isValidStorePreference,
	parseStoreRecommendationSource,
	type StoreRecommendationState
} from './store-recommendation';

describe('store-recommendation', () => {
	it('validates preferences and chains', () => {
		expect(isValidStorePreference('lowestPrice')).toBe(true);
		expect(isValidStorePreference('invalid')).toBe(false);
		expect(isValidStoreChain('ica')).toBe(true);
		expect(isValidStoreChain('unknown')).toBe(false);
	});

	it('parses entry source from query param', () => {
		expect(parseStoreRecommendationSource('home')).toBe('home');
		expect(parseStoreRecommendationSource('inkop_plan')).toBe('inkop_plan');
		expect(parseStoreRecommendationSource(null)).toBe('direct');
		expect(parseStoreRecommendationSource('other')).toBe('direct');
	});

	it('requires all three answers for completion', () => {
		const empty: StoreRecommendationState = {
			preference: null,
			chains: [],
			compareIca: null
		};
		expect(isStoreRecommendationComplete(empty)).toBe(false);

		const partial: StoreRecommendationState = {
			preference: 'closest',
			chains: ['ica'],
			compareIca: null
		};
		expect(isStoreRecommendationComplete(partial)).toBe(false);

		const complete: StoreRecommendationState = {
			preference: 'lowestPrice',
			chains: ['ica', 'coop'],
			compareIca: true
		};
		expect(isStoreRecommendationComplete(complete)).toBe(true);
	});
});
