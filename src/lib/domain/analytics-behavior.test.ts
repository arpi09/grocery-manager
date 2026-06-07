import { describe, expect, it } from 'vitest';
import { normalizeAnalyticsRoute, parseAnalyticsBehaviorPeriodDays } from './analytics-behavior';

describe('normalizeAnalyticsRoute', () => {
	it('keeps static paths unchanged', () => {
		expect(normalizeAnalyticsRoute('/hem')).toBe('/hem');
		expect(normalizeAnalyticsRoute('/inkop')).toBe('/inkop');
		expect(normalizeAnalyticsRoute('/')).toBe('/');
	});

	it('normalizes dynamic inventory and item routes', () => {
		expect(normalizeAnalyticsRoute('/inventory/kyl')).toBe('/inventory/:location');
		expect(normalizeAnalyticsRoute('/item/abc123/edit')).toBe('/item/:id/edit');
		expect(normalizeAnalyticsRoute('/recept/recipe-1/laga')).toBe('/recept/:id/laga');
	});

	it('strips query and hash', () => {
		expect(normalizeAnalyticsRoute('/hem?tab=1#section')).toBe('/hem');
	});
});

describe('parseAnalyticsBehaviorPeriodDays', () => {
	it('accepts 7 and 30 only', () => {
		expect(parseAnalyticsBehaviorPeriodDays('30')).toBe(30);
		expect(parseAnalyticsBehaviorPeriodDays('7')).toBe(7);
		expect(parseAnalyticsBehaviorPeriodDays('14')).toBe(7);
	});
});
