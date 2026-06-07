import { describe, expect, it } from 'vitest';
import {
	buildEatFirstWeekUrl,
	EAT_FIRST_WEEK_MAX_MEALS,
	EAT_FIRST_WEEK_MIN_MEALS,
	EAT_FIRST_WEEK_PATH,
	parseEatFirstWeekInboundSource,
	resolveEatFirstWeekMealCount,
	shouldShowEatFirstWeekInboundBanner
} from '$lib/domain/eat-first-week';

describe('resolveEatFirstWeekMealCount', () => {
	it('returns 3–5 meals based on expiring inventory urgency', () => {
		expect(resolveEatFirstWeekMealCount(0)).toBe(EAT_FIRST_WEEK_MIN_MEALS);
		expect(resolveEatFirstWeekMealCount(1)).toBe(3);
		expect(resolveEatFirstWeekMealCount(2)).toBe(3);
		expect(resolveEatFirstWeekMealCount(3)).toBe(4);
		expect(resolveEatFirstWeekMealCount(4)).toBe(4);
		expect(resolveEatFirstWeekMealCount(5)).toBe(EAT_FIRST_WEEK_MAX_MEALS);
		expect(resolveEatFirstWeekMealCount(12)).toBe(EAT_FIRST_WEEK_MAX_MEALS);
	});
});

describe('buildEatFirstWeekUrl', () => {
	it('builds week view path with optional inbound source', () => {
		expect(buildEatFirstWeekUrl()).toBe(EAT_FIRST_WEEK_PATH);
		expect(buildEatFirstWeekUrl('push')).toBe('/planer/vecka?from=push');
		expect(buildEatFirstWeekUrl('email')).toBe('/planer/vecka?from=email');
	});
});

describe('parseEatFirstWeekInboundSource', () => {
	it('accepts known inbound sources only', () => {
		expect(parseEatFirstWeekInboundSource('push')).toBe('push');
		expect(parseEatFirstWeekInboundSource('email')).toBe('email');
		expect(parseEatFirstWeekInboundSource('hero')).toBe('hero');
		expect(parseEatFirstWeekInboundSource('unknown')).toBeNull();
		expect(parseEatFirstWeekInboundSource(null)).toBeNull();
	});
});

describe('shouldShowEatFirstWeekInboundBanner', () => {
	it('shows banner for push and email deep links', () => {
		expect(shouldShowEatFirstWeekInboundBanner('push')).toBe(true);
		expect(shouldShowEatFirstWeekInboundBanner('email')).toBe(true);
		expect(shouldShowEatFirstWeekInboundBanner('hero')).toBe(false);
		expect(shouldShowEatFirstWeekInboundBanner(null)).toBe(false);
	});
});
