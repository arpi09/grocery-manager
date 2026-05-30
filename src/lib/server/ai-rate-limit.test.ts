import { describe, expect, it, vi } from 'vitest';
import { aiRateLimitJsonResponse } from './ai-rate-limit';

describe('aiRateLimitJsonResponse', () => {
	it('returns 429 with i18n error payload', async () => {
		const response = aiRateLimitJsonResponse('sv', {
			allowed: false,
			snapshot: {
				kind: 'ai_scan',
				limit: 15,
				used: 15,
				period: 'month',
				periodKey: '2026-05'
			}
		});

		expect(response.status).toBe(429);
		const body = await response.json();
		expect(body.code).toBe('ai_rate_limit');
		expect(body.kind).toBe('ai_scan');
		expect(body.limit).toBe(15);
		expect(body.error).toContain('15');
	});
});

describe('requireAiQuota', () => {
	it('returns null when quota is available', async () => {
		const { requireAiQuota } = await import('./ai-rate-limit');
		const tryConsume = vi.fn().mockResolvedValue({
			allowed: true,
			snapshot: {
				kind: 'ai_scan',
				limit: 15,
				used: 1,
				period: 'month',
				periodKey: '2026-05'
			}
		});

		const locals = {
			locale: 'en',
			householdId: 'house-1',
			aiRateLimitService: { tryConsume }
		} as unknown as App.Locals;

		const result = await requireAiQuota(locals, 'ai_scan', 'user-1');
		expect(result).toBeNull();
		expect(tryConsume).toHaveBeenCalledWith({
			householdId: 'house-1',
			userId: 'user-1',
			kind: 'ai_scan',
			tier: 'free'
		});
	});
});
