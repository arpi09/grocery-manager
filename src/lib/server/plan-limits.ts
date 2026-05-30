import { PlanLimitExceededError } from '$lib/application/plan-limits.service';
import { translate } from '$lib/i18n/messages';
import type { Locale } from '$lib/i18n/locale';
import type { PlanLimitKey } from '$lib/domain/plan-limits';
import type { PlanTier } from '$lib/domain/plan';
import type { PlanLimitsService } from '$lib/application/plan-limits.service';

export function translatePlanLimitError(locale: Locale, error: PlanLimitExceededError): string {
	return translate(locale, error.messageKey, {
		limit: error.limit ?? 0
	});
}

export async function requirePlanLimit(
	planLimitsService: PlanLimitsService,
	input: {
		userId: string;
		householdId: string | null;
		tier: PlanTier;
		limitKey: PlanLimitKey;
		usageDelta?: number;
	}
): Promise<void> {
	await planLimitsService.requireWithinLimit(input);
}

export { PlanLimitExceededError };
