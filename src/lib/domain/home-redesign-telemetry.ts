import type { HomeForYouKind } from './home-for-you';
import type { HeroStatus, HomeHeroTimeBand } from './home-hero';
import type { HomeState } from './home-state';

export type HomeCountBucket = '0' | '1' | '2-5' | '6+';

export function bucketHomeCount(count: number): HomeCountBucket {
	if (count <= 0) return '0';
	if (count === 1) return '1';
	if (count <= 5) return '2-5';
	return '6+';
}

export interface HomeViewedMetadata {
	homeState: HomeState;
	hasRecommendation: boolean;
	recommendationKind: HomeForYouKind | null;
	heroBand: HomeHeroTimeBand;
	heroStatus: HeroStatus;
	expiringCount: HomeCountBucket;
	shoppingCount: HomeCountBucket;
	pantryCount: HomeCountBucket;
}

export function buildHomeViewedMetadata(input: {
	homeState: HomeState;
	hasRecommendation: boolean;
	recommendationKind: HomeForYouKind | null;
	heroBand: HomeHeroTimeBand;
	heroStatus: HeroStatus;
	expiringCount: number;
	shoppingCount: number;
	pantryCount: number;
}): Record<string, unknown> {
	return {
		homeState: input.homeState,
		hasRecommendation: input.hasRecommendation,
		recommendationKind: input.recommendationKind,
		heroBand: input.heroBand,
		heroStatus: input.heroStatus,
		expiringCount: bucketHomeCount(input.expiringCount),
		shoppingCount: bucketHomeCount(input.shoppingCount),
		pantryCount: bucketHomeCount(input.pantryCount)
	} satisfies HomeViewedMetadata;
}

export function resolveHeroScrollTargetId(input: {
	hasForYou: boolean;
	expiringCount: number;
}): string {
	if (input.hasForYou) return 'home-for-you';
	if (input.expiringCount > 0) return 'home-expiring-card';
	return 'home-shopping-card';
}
