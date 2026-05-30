import { describe, expect, it, vi } from 'vitest';
import { PlanLimitExceededError, PlanLimitsService } from './plan-limits.service';
import type { AiRateLimitService } from './ai-rate-limit.service';
import type { IPlanLimitsRepository } from '$lib/infrastructure/repositories/plan-limits.repository';

function aiSnapshot(used: number, limit: number | null = 15) {
	return {
		kind: 'ai_scan' as const,
		limit,
		used,
		period: 'month' as const,
		periodKey: '2026-05'
	};
}

describe('PlanLimitsService', () => {
	function createService(overrides: {
		nonAi?: Partial<{ maxInventoryItems: number; maxHouseholdMembers: number }>;
		aiScanUsed?: number;
	}) {
		const repository: IPlanLimitsRepository = {
			getNonAiUsage: vi.fn().mockResolvedValue({
				maxInventoryItems: 0,
				maxHouseholdMembers: 0,
				...overrides.nonAi
			})
		};
		const aiRateLimitService = {
			getUsageSnapshot: vi.fn().mockImplementation(({ kind }) => {
				if (kind === 'ai_scan') {
					return Promise.resolve(aiSnapshot(overrides.aiScanUsed ?? 0));
				}
				if (kind === 'receipt_pdf') {
					return Promise.resolve({ ...aiSnapshot(0, 5), kind: 'receipt_pdf' as const });
				}
				return Promise.resolve({
					...aiSnapshot(0, 2),
					kind: 'smart_fill' as const,
					period: 'week' as const
				});
			})
		} as unknown as AiRateLimitService;

		return new PlanLimitsService(repository, aiRateLimitService);
	}

	it('returns blocked keys when inventory is at cap', async () => {
		const service = createService({ nonAi: { maxInventoryItems: 150 } });
		const snapshot = await service.getSnapshot({
			userId: 'u1',
			householdId: 'h1',
			tier: 'free'
		});
		expect(snapshot.blockedKeys).toContain('maxInventoryItems');
	});

	it('throws when AI scan quota is exhausted', async () => {
		const service = createService({ aiScanUsed: 15 });
		await expect(
			service.requireWithinLimit({
				userId: 'u1',
				householdId: 'h1',
				tier: 'free',
				limitKey: 'aiScansPerMonth'
			})
		).rejects.toMatchObject({
			name: 'PlanLimitExceededError',
			messageKey: 'errors.api.aiRateLimitAiScan'
		} satisfies Partial<PlanLimitExceededError>);
	});

	it('allows Pro tier without checking usage', async () => {
		const service = createService({ aiScanUsed: 999 });
		await expect(
			service.requireWithinLimit({
				userId: 'u1',
				householdId: 'h1',
				tier: 'pro',
				limitKey: 'aiScansPerMonth'
			})
		).resolves.toBeUndefined();
	});
});
