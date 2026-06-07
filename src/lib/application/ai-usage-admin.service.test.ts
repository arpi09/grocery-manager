import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiUsageAdminService } from './ai-usage-admin.service';
import type { IAiUsageRepository } from '$lib/infrastructure/repositories/ai-usage.repository';
import { emptyAdminUsageByKind } from '$lib/domain/ai-usage-admin';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: { OPENAI_MONTHLY_BUDGET_USD: undefined as string | undefined }
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

describe('AiUsageAdminService', () => {
	const repository: IAiUsageRepository = {
		getCount: vi.fn(),
		increment: vi.fn(),
		getAdminSummary: vi.fn()
	};

	const service = new AiUsageAdminService(repository);
	const now = new Date('2026-05-30T12:00:00Z');

	beforeEach(() => {
		mockEnv.OPENAI_MONTHLY_BUDGET_USD = undefined;
		vi.clearAllMocks();
	});

	afterEach(() => {
		mockEnv.OPENAI_MONTHLY_BUDGET_USD = undefined;
	});

	it('aggregates repository data with budget status and free tier limits', async () => {
		const monthlyByKind = { ...emptyAdminUsageByKind(), ai_scan: 100, receipt_pdf: 10 };
		vi.mocked(repository.getAdminSummary).mockResolvedValue({
			periodDays: 30,
			byKind: monthlyByKind,
			monthlyByKind,
			topHouseholdCounts: [50, 20],
			monthlyTotal: 110,
			monthKey: '2026-05'
		});
		mockEnv.OPENAI_MONTHLY_BUDGET_USD = '1.5';

		const summary = await service.getSummary(30, now);

		expect(repository.getAdminSummary).toHaveBeenCalledWith({
			since: new Date(now.getTime() - 30 * 86_400_000),
			monthStart: new Date(Date.UTC(2026, 4, 1)),
			monthKey: '2026-05',
			topLimit: 10,
			periodDays: 30
		});
		expect(summary.estimatedMonthlyUsd).toBeCloseTo(100 * 0.015 + 10 * 0.02, 5);
		expect(summary.budgetUsd).toBe(1.5);
		expect(summary.budgetExceeded).toBe(true);
		expect(summary.budgetNearLimit).toBe(false);
		expect(summary.freeTierLimits).toHaveLength(4);
	});

	it('uses a 7-day rolling window when requested', async () => {
		vi.mocked(repository.getAdminSummary).mockResolvedValue({
			periodDays: 7,
			byKind: emptyAdminUsageByKind(),
			monthlyByKind: emptyAdminUsageByKind(),
			topHouseholdCounts: [],
			monthlyTotal: 0,
			monthKey: '2026-05'
		});

		await service.getSummary(7, now);

		expect(repository.getAdminSummary).toHaveBeenCalledWith(
			expect.objectContaining({
				since: new Date(now.getTime() - 7 * 86_400_000),
				periodDays: 7
			})
		);
	});

	it('isMonthlyBudgetExceeded reflects summary budget flag', async () => {
		vi.mocked(repository.getAdminSummary).mockResolvedValue({
			periodDays: 30,
			byKind: { ...emptyAdminUsageByKind(), smart_fill: 500 },
			monthlyByKind: { ...emptyAdminUsageByKind(), smart_fill: 500 },
			topHouseholdCounts: [],
			monthlyTotal: 500,
			monthKey: '2026-05'
		});
		mockEnv.OPENAI_MONTHLY_BUDGET_USD = '1';

		await expect(service.isMonthlyBudgetExceeded(now)).resolves.toBe(true);
	});
});
