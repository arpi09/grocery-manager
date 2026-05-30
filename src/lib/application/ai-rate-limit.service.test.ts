import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiRateLimitService } from './ai-rate-limit.service';
import type { IAiUsageRepository } from '$lib/infrastructure/repositories/ai-usage.repository';
import { FREE_LIMITS } from '$lib/domain/plan';

describe('AiRateLimitService', () => {
	let repository: IAiUsageRepository;
	let service: AiRateLimitService;

	beforeEach(() => {
		repository = {
			getCount: vi.fn(),
			increment: vi.fn()
		};
		service = new AiRateLimitService(repository);
	});

	it('allows pro tier without touching the repository', async () => {
		const result = await service.tryConsume({
			householdId: 'house-1',
			userId: 'user-1',
			kind: 'ai_scan',
			tier: 'pro'
		});

		expect(result.allowed).toBe(true);
		expect(repository.getCount).not.toHaveBeenCalled();
		expect(repository.increment).not.toHaveBeenCalled();
	});

	it('consumes one unit when under the free limit', async () => {
		vi.mocked(repository.getCount).mockResolvedValue(0);
		vi.mocked(repository.increment).mockResolvedValue(1);

		const result = await service.tryConsume({
			householdId: 'house-1',
			userId: 'user-1',
			kind: 'smart_fill',
			tier: 'free',
			now: new Date('2026-05-30T12:00:00Z')
		});

		expect(result.allowed).toBe(true);
		if (result.allowed) {
			expect(result.snapshot.used).toBe(1);
			expect(result.snapshot.limit).toBe(FREE_LIMITS.smartFillPerWeek);
		}
		expect(repository.increment).toHaveBeenCalledWith(
			expect.objectContaining({
				scopeId: 'house-1',
				userId: 'user-1',
				kind: 'smart_fill'
			})
		);
	});

	it('denies when the free limit is reached', async () => {
		vi.mocked(repository.getCount).mockResolvedValue(FREE_LIMITS.receiptPdfParsesPerMonth);

		const result = await service.tryConsume({
			householdId: 'house-1',
			userId: 'user-1',
			kind: 'receipt_pdf',
			tier: 'free'
		});

		expect(result.allowed).toBe(false);
		if (!result.allowed) {
			expect(result.snapshot.used).toBe(FREE_LIMITS.receiptPdfParsesPerMonth);
		}
		expect(repository.increment).not.toHaveBeenCalled();
	});
});
