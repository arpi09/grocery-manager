import { describe, expect, it } from 'vitest';
import {
	adminFreeTierRateLimits,
	parseAdminAiUsagePeriodDays
} from './ai-usage-admin';

describe('parseAdminAiUsagePeriodDays', () => {
	it('accepts 7 and defaults to 30 otherwise', () => {
		expect(parseAdminAiUsagePeriodDays('7')).toBe(7);
		expect(parseAdminAiUsagePeriodDays(7)).toBe(7);
		expect(parseAdminAiUsagePeriodDays('30')).toBe(30);
		expect(parseAdminAiUsagePeriodDays(null)).toBe(30);
		expect(parseAdminAiUsagePeriodDays('14')).toBe(30);
		expect(parseAdminAiUsagePeriodDays('nope')).toBe(30);
	});
});

describe('adminFreeTierRateLimits', () => {
	it('maps free tier caps to AI usage kinds', () => {
		expect(adminFreeTierRateLimits()).toEqual([
			{ kind: 'ai_scan', limit: 75, period: 'month' },
			{ kind: 'receipt_pdf', limit: 25, period: 'month' },
			{ kind: 'smart_fill', limit: 8, period: 'week' },
			{ kind: 'admin_insights', limit: 40, period: 'week' },
			{ kind: 'weekly_plan', limit: 4, period: 'week' }
		]);
	});
});
