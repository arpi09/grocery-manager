import { describe, expect, it } from 'vitest';
import {
	aiUsagePeriodForKind,
	isWithinAiLimit,
	monthPeriodKey,
	periodKeyForKind,
	resolveAiUsageScope
} from './ai-usage';
import { FREE_LIMITS } from './plan';

describe('ai-usage', () => {
	it('uses monthly periods for scans and receipt PDF', () => {
		expect(aiUsagePeriodForKind('ai_scan')).toBe('month');
		expect(aiUsagePeriodForKind('receipt_pdf')).toBe('month');
		expect(aiUsagePeriodForKind('smart_fill')).toBe('week');
	});

	it('builds stable month keys in UTC', () => {
		expect(monthPeriodKey(new Date('2026-05-30T12:00:00Z'))).toBe('2026-05');
	});

	it('builds ISO week keys', () => {
		expect(periodKeyForKind('smart_fill', new Date('2026-05-30T12:00:00Z'))).toMatch(
			/^2026-W\d{2}$/
		);
	});

	it('scopes usage to household when present', () => {
		expect(resolveAiUsageScope('house-1', 'user-1')).toBe('house-1');
		expect(resolveAiUsageScope(null, 'user-1')).toBe('user:user-1');
	});

	it('blocks free tier at configured limits', () => {
		expect(isWithinAiLimit('free', 'ai_scan', FREE_LIMITS.aiScansPerMonth - 1)).toBe(true);
		expect(isWithinAiLimit('free', 'ai_scan', FREE_LIMITS.aiScansPerMonth)).toBe(false);
		expect(isWithinAiLimit('pro', 'ai_scan', 999)).toBe(true);
	});
});
