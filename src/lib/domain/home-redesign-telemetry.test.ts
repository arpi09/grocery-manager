import { describe, expect, it } from 'vitest';
import {
	bucketHomeCount,
	buildHomeViewedMetadata,
	resolveHeroScrollTargetId
} from './home-redesign-telemetry';

describe('bucketHomeCount', () => {
	it('buckets counts for telemetry', () => {
		expect(bucketHomeCount(0)).toBe('0');
		expect(bucketHomeCount(1)).toBe('1');
		expect(bucketHomeCount(2)).toBe('2-5');
		expect(bucketHomeCount(5)).toBe('2-5');
		expect(bucketHomeCount(6)).toBe('6+');
		expect(bucketHomeCount(99)).toBe('6+');
	});
});

describe('buildHomeViewedMetadata', () => {
	it('includes hero band, status, and bucketed counts', () => {
		expect(
			buildHomeViewedMetadata({
				homeState: 'steady',
				hasRecommendation: true,
				recommendationKind: 'replenishment',
				heroBand: 'morning',
				heroStatus: 'healthy',
				expiringCount: 0,
				shoppingCount: 3,
				pantryCount: 12
			})
		).toEqual({
			homeState: 'steady',
			hasRecommendation: true,
			recommendationKind: 'replenishment',
			heroBand: 'morning',
			heroStatus: 'healthy',
			expiringCount: '0',
			shoppingCount: '2-5',
			pantryCount: '6+'
		});
	});
});

describe('resolveHeroScrollTargetId', () => {
	it('prefers For You, then expiring, then shopping', () => {
		expect(resolveHeroScrollTargetId({ hasForYou: true, expiringCount: 2 })).toBe('home-for-you');
		expect(resolveHeroScrollTargetId({ hasForYou: false, expiringCount: 1 })).toBe(
			'home-expiring-card'
		);
		expect(resolveHeroScrollTargetId({ hasForYou: false, expiringCount: 0 })).toBe(
			'home-shopping-card'
		);
	});
});
