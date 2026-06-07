import type { AiUsageKind } from '$lib/domain/ai-usage';
import type { MessageKey } from '$lib/i18n/messages';
import {
	FREE_LIMITS,
	isProTier,
	PRO_LIMITS,
	type PlanTier
} from '$lib/domain/plan';

/** Keys aligned with FREE_LIMITS / PRO_LIMITS — shared by UI and API enforcement. */
export const PLAN_LIMIT_KEYS = [
	'maxInventoryItems',
	'maxHouseholdMembers',
	'aiScansPerMonth',
	'receiptPdfParsesPerMonth',
	'smartFillPerWeek'
] as const;

export type PlanLimitKey = (typeof PLAN_LIMIT_KEYS)[number];

export interface PlanLimitUsage {
	maxInventoryItems: number;
	maxHouseholdMembers: number;
	aiScansPerMonth: number;
	receiptPdfParsesPerMonth: number;
	smartFillPerWeek: number;
}

export interface PlanLimitStatus {
	key: PlanLimitKey;
	used: number;
	limit: number | null;
	atLimit: boolean;
}

export interface PlanLimitsSnapshot {
	tier: PlanTier;
	limits: PlanLimitStatus[];
	/** Limits at or above cap (empty for Pro). */
	blockedKeys: PlanLimitKey[];
}

export function getTierLimit(key: PlanLimitKey, tier: PlanTier): number | null {
	if (isProTier(tier)) {
		return PRO_LIMITS[key];
	}
	return FREE_LIMITS[key];
}

export function evaluatePlanLimit(
	key: PlanLimitKey,
	used: number,
	tier: PlanTier
): PlanLimitStatus {
	const limit = getTierLimit(key, tier);
	const atLimit = limit !== null && used >= limit;
	return { key, used, limit, atLimit };
}

export function buildPlanLimitsSnapshot(
	tier: PlanTier,
	usage: PlanLimitUsage
): PlanLimitsSnapshot {
	const limits = PLAN_LIMIT_KEYS.map((key) => evaluatePlanLimit(key, usage[key], tier));
	const blockedKeys = limits.filter((row) => row.atLimit).map((row) => row.key);
	return { tier, limits, blockedKeys };
}

/** Maps AI usage kinds to plan limit keys (item #11 rate limits). */
export function planLimitKeyForAiUsageKind(kind: AiUsageKind): PlanLimitKey {
	const map: Record<AiUsageKind, PlanLimitKey> = {
		ai_scan: 'aiScansPerMonth',
		receipt_pdf: 'receiptPdfParsesPerMonth',
		smart_fill: 'smartFillPerWeek',
		admin_insights: 'smartFillPerWeek'
	};
	return map[kind];
}

/** Maps plan limit keys to AI usage kinds (item #11 rate limits). */
export function aiUsageKindForPlanLimit(key: PlanLimitKey): AiUsageKind | null {
	const map: Partial<Record<PlanLimitKey, AiUsageKind>> = {
		aiScansPerMonth: 'ai_scan',
		receiptPdfParsesPerMonth: 'receipt_pdf',
		smartFillPerWeek: 'smart_fill'
	};
	return map[key] ?? null;
}

/** i18n key for API / form errors when a limit is exceeded. */
export function planLimitErrorKey(key: PlanLimitKey): MessageKey {
	const aiKind = aiUsageKindForPlanLimit(key);
	if (aiKind) {
		const map: Record<AiUsageKind, MessageKey> = {
			ai_scan: 'errors.api.aiRateLimitAiScan',
			receipt_pdf: 'errors.api.aiRateLimitReceiptPdf',
			smart_fill: 'errors.api.aiRateLimitSmartFill',
			admin_insights: 'errors.api.openAiRateLimit'
		};
		return map[aiKind];
	}
	const map = {
		maxInventoryItems: 'errors.plan.inventoryLimit',
		maxHouseholdMembers: 'errors.plan.membersLimit'
	} as const satisfies Record<
		Exclude<PlanLimitKey, 'aiScansPerMonth' | 'receiptPdfParsesPerMonth' | 'smartFillPerWeek'>,
		MessageKey
	>;
	return map[key as keyof typeof map];
}

/** i18n key for settings usage row labels. */
export function planLimitUsageLabelKey(key: PlanLimitKey): MessageKey {
	const map = {
		maxInventoryItems: 'settings.plan.usage.inventory',
		maxHouseholdMembers: 'settings.plan.usage.members',
		aiScansPerMonth: 'settings.plan.usage.aiScans',
		receiptPdfParsesPerMonth: 'settings.plan.usage.receipts',
		smartFillPerWeek: 'settings.plan.usage.smartFill'
	} as const satisfies Record<PlanLimitKey, MessageKey>;
	return map[key];
}

/** i18n key for the primary limit name in the settings banner. */
export function planLimitBannerDetailKey(key: PlanLimitKey): MessageKey {
	const map = {
		maxInventoryItems: 'settings.plan.limitDetail.inventory',
		maxHouseholdMembers: 'settings.plan.limitDetail.members',
		aiScansPerMonth: 'settings.plan.limitDetail.aiScans',
		receiptPdfParsesPerMonth: 'settings.plan.limitDetail.receipts',
		smartFillPerWeek: 'settings.plan.limitDetail.smartFill'
	} as const satisfies Record<PlanLimitKey, MessageKey>;
	return map[key];
}
