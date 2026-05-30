import {
	aiUsagePeriodForKind,
	type AiRateLimitSnapshot,
	type AiUsageKind,
	isWithinAiLimit,
	periodKeyForKind,
	resolveAiUsageScope
} from '$lib/domain/ai-usage';
import { getAiLimit, type PlanTier } from '$lib/domain/plan';
import type { IAiUsageRepository } from '$lib/infrastructure/repositories/ai-usage.repository';

export interface TryConsumeAiUsageInput {
	householdId: string | null;
	userId: string;
	kind: AiUsageKind;
	tier: PlanTier;
	now?: Date;
}

export type TryConsumeAiUsageResult =
	| { allowed: true; snapshot: AiRateLimitSnapshot }
	| { allowed: false; snapshot: AiRateLimitSnapshot };

export class AiRateLimitService {
	constructor(private readonly repository: IAiUsageRepository) {}

	async getUsageSnapshot(input: TryConsumeAiUsageInput): Promise<AiRateLimitSnapshot> {
		const periodKey = periodKeyForKind(input.kind, input.now);
		const scopeId = resolveAiUsageScope(input.householdId, input.userId);
		const used = await this.repository.getCount({
			scopeId,
			kind: input.kind,
			periodKey
		});

		return {
			kind: input.kind,
			limit: getAiLimit(input.tier, input.kind),
			used,
			period: aiUsagePeriodForKind(input.kind),
			periodKey
		};
	}

	async tryConsume(input: TryConsumeAiUsageInput): Promise<TryConsumeAiUsageResult> {
		const periodKey = periodKeyForKind(input.kind, input.now);
		const scopeId = resolveAiUsageScope(input.householdId, input.userId);
		const limit = getAiLimit(input.tier, input.kind);

		if (limit === null) {
			return {
				allowed: true,
				snapshot: {
					kind: input.kind,
					limit: null,
					used: 0,
					period: aiUsagePeriodForKind(input.kind),
					periodKey
				}
			};
		}

		const usedBefore = await this.repository.getCount({ scopeId, kind: input.kind, periodKey });
		const snapshot: AiRateLimitSnapshot = {
			kind: input.kind,
			limit,
			used: usedBefore,
			period: aiUsagePeriodForKind(input.kind),
			periodKey
		};

		if (!isWithinAiLimit(input.tier, input.kind, usedBefore)) {
			return { allowed: false, snapshot };
		}

		const usedAfter = await this.repository.increment({
			scopeId,
			userId: input.userId,
			kind: input.kind,
			periodKey
		});

		return {
			allowed: true,
			snapshot: { ...snapshot, used: usedAfter }
		};
	}
}
