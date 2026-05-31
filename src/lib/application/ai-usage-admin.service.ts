import type { AdminAiUsageSummary } from '$lib/domain/ai-usage-admin';
import { ADMIN_AI_USAGE_PERIOD_DAYS, ADMIN_AI_USAGE_TOP_HOUSEHOLDS } from '$lib/domain/ai-usage-admin';
import { monthPeriodKey } from '$lib/domain/ai-usage';
import type { IAiUsageRepository } from '$lib/infrastructure/repositories/ai-usage.repository';

export class AiUsageAdminService {
	constructor(private readonly repository: IAiUsageRepository) {}

	getSummary(now = new Date()): Promise<AdminAiUsageSummary> {
		const since = new Date(now.getTime() - ADMIN_AI_USAGE_PERIOD_DAYS * 86_400_000);
		const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

		return this.repository.getAdminSummary({
			since,
			monthStart,
			monthKey: monthPeriodKey(now),
			topLimit: ADMIN_AI_USAGE_TOP_HOUSEHOLDS
		});
	}
}
