import type { AiRateLimitService } from '$lib/application/ai-rate-limit.service';
import {
	buildPlanLimitsSnapshot,
	evaluatePlanLimit,
	getTierLimit,
	planLimitErrorKey,
	type PlanLimitKey,
	type PlanLimitsSnapshot,
	type PlanLimitStatus,
	type PlanLimitUsage
} from '$lib/domain/plan-limits';
import { isProTier, type PlanTier } from '$lib/domain/plan';
import type { MessageKey } from '$lib/i18n/messages';
import type { IPlanLimitsRepository } from '$lib/infrastructure/repositories/plan-limits.repository';

export class PlanLimitExceededError extends Error {
	readonly name = 'PlanLimitExceededError';

	constructor(
		public readonly limitKey: PlanLimitKey,
		public readonly messageKey: MessageKey,
		public readonly limit: number | null
	) {
		super(messageKey);
	}
}

export interface PlanLimitCheckInput {
	userId: string;
	householdId: string | null;
	tier: PlanTier;
	limitKey: PlanLimitKey;
	/** When checking before an action, pass +1 to include the pending use. */
	usageDelta?: number;
	now?: Date;
}

export class PlanLimitsService {
	constructor(
		private readonly repository: IPlanLimitsRepository,
		private readonly aiRateLimitService: AiRateLimitService
	) {}

	private async loadUsage(input: {
		userId: string;
		householdId: string | null;
		tier: PlanTier;
		now?: Date;
	}): Promise<PlanLimitUsage> {
		const nonAi = await this.repository.getNonAiUsage(input.householdId);
		const [aiScan, receiptPdf, smartFill] = await Promise.all(
			(['ai_scan', 'receipt_pdf', 'smart_fill'] as const).map((kind) =>
				this.aiRateLimitService.getUsageSnapshot({
					householdId: input.householdId,
					userId: input.userId,
					kind,
					tier: input.tier,
					now: input.now
				})
			)
		);

		return {
			...nonAi,
			aiScansPerMonth: aiScan.used,
			receiptPdfParsesPerMonth: receiptPdf.used,
			smartFillPerWeek: smartFill.used
		};
	}

	async getSnapshot(input: {
		userId: string;
		householdId: string | null;
		tier: PlanTier;
		now?: Date;
	}): Promise<PlanLimitsSnapshot> {
		const usage = await this.loadUsage(input);
		return buildPlanLimitsSnapshot(input.tier, usage);
	}

	async checkLimit(input: PlanLimitCheckInput): Promise<PlanLimitStatus> {
		const usage = await this.loadUsage(input);
		const used = usage[input.limitKey];
		const delta = input.usageDelta ?? 0;
		return evaluatePlanLimit(input.limitKey, used + delta, input.tier);
	}

	async requireWithinLimit(input: PlanLimitCheckInput): Promise<void> {
		if (isProTier(input.tier)) {
			return;
		}
		const status = await this.checkLimit(input);
		if (status.atLimit) {
			throw new PlanLimitExceededError(
				input.limitKey,
				planLimitErrorKey(input.limitKey),
				getTierLimit(input.limitKey, input.tier)
			);
		}
	}
}

