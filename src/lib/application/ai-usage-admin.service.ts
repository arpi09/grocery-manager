import type { AdminAiUsagePeriodDays, AdminAiUsageSummary } from '$lib/domain/ai-usage-admin';
import {
	ADMIN_AI_USAGE_PERIOD_DAYS,
	ADMIN_AI_USAGE_TOP_HOUSEHOLDS,
	adminFreeTierRateLimits
} from '$lib/domain/ai-usage-admin';
import { monthPeriodKey } from '$lib/domain/ai-usage';
import {
	estimateOpenAiSpendUsd,
	openAiBudgetStatus,
	parseOpenAiMonthlyBudgetUsd
} from '$lib/domain/openai-budget';
import type { IAiUsageRepository } from '$lib/infrastructure/repositories/ai-usage.repository';
import { env } from '$env/dynamic/private';

export class AiUsageAdminService {
	constructor(private readonly repository: IAiUsageRepository) {}

	async getSummary(
		periodDays: AdminAiUsagePeriodDays = ADMIN_AI_USAGE_PERIOD_DAYS,
		now = new Date()
	): Promise<AdminAiUsageSummary> {
		const since = new Date(now.getTime() - periodDays * 86_400_000);
		const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

		const base = await this.repository.getAdminSummary({
			since,
			monthStart,
			monthKey: monthPeriodKey(now),
			topLimit: ADMIN_AI_USAGE_TOP_HOUSEHOLDS,
			periodDays
		});

		const budgetUsd = parseOpenAiMonthlyBudgetUsd(env.OPENAI_MONTHLY_BUDGET_USD);
		const estimatedMonthlyUsd = estimateOpenAiSpendUsd(base.monthlyByKind);
		const { nearBudget, overBudget } = openAiBudgetStatus(estimatedMonthlyUsd, budgetUsd);

		return {
			...base,
			estimatedMonthlyUsd,
			budgetUsd,
			budgetNearLimit: nearBudget,
			budgetExceeded: overBudget,
			freeTierLimits: adminFreeTierRateLimits()
		};
	}

	async isMonthlyBudgetExceeded(now = new Date()): Promise<boolean> {
		const summary = await this.getSummary(ADMIN_AI_USAGE_PERIOD_DAYS, now);
		return summary.budgetExceeded;
	}
}
