/** Subscription tier — enforcement and Stripe come later. */
export type PlanTier = 'free' | 'pro';

/** Hypothesised price points (SEK) — not charged until Stripe phase. */
export const PRICE_HYPOTHESIS_SEK = {
	monthly: 39,
	yearly: 299,
	/** Competitor reference band from COMPETITIVE_ANALYSIS §12 */
	competitorMonthlyLow: 29,
	competitorMonthlyHigh: 49,
	competitorYearlyLow: 199,
	competitorYearlyHigh: 399
} as const;

/** Free tier limits — single source of truth for future rate limits. */
export const FREE_LIMITS = {
	maxInventoryItems: 150,
	maxHouseholdMembers: 2,
	aiScansPerMonth: 15,
	receiptPdfParsesPerMonth: 5,
	smartFillPerWeek: 2,
	adminInsightsPerWeek: 20
} as const;

/** Pro tier — null means unlimited. */
export const PRO_LIMITS = {
	maxInventoryItems: null,
	maxHouseholdMembers: 6,
	aiScansPerMonth: null,
	receiptPdfParsesPerMonth: null,
	smartFillPerWeek: null,
	adminInsightsPerWeek: null
} as const;

/** Rough AI unit economics (gpt-4.1-mini, May 2026 estimates). */
export const AI_UNIT_ECONOMICS = {
	/** Typical receipt PDF parse (structured output, ~2–8k tokens). */
	receiptParseSekLow: 0.15,
	receiptParseSekHigh: 0.8,
	/** Product-from-image or short smart-fill call. */
	lightAiCallSekLow: 0.05,
	lightAiCallSekHigh: 0.25,
	model: 'gpt-4.1-mini'
} as const;

/** When to implement Stripe Checkout (indicative gates). */
export const STRIPE_READINESS_GATES = {
	/** Early PMF signal — see PMF_TARGETS.d30RetentionEarly */
	d30RetentionMin: 0.15,
	/** Mature signal — see PMF_TARGETS.d30RetentionMature */
	d30RetentionTarget: 0.25,
	/** Users who opted into paid waitlist / expressed upgrade intent */
	payingWaitlistMin: 50
} as const;

/** Features included in Pro (marketing + settings copy keys). */
export const PRO_FEATURE_KEYS = [
	'unlimitedAi',
	'unlimitedReceiptPdf',
	'unlimitedSmartFill',
	'insightsAndStats',
	'moreHouseholdMembers'
] as const;

export type ProFeatureKey = (typeof PRO_FEATURE_KEYS)[number];

/** Default tier for all accounts until billing exists. */
export const DEFAULT_PLAN_TIER: PlanTier = 'free';

export function isProTier(tier: PlanTier): boolean {
	return tier === 'pro';
}

export type AiUsageKind = 'ai_scan' | 'receipt_pdf' | 'smart_fill' | 'admin_insights';

/** Returns null when the tier has no cap (Pro). */
export function getAiLimit(tier: PlanTier, kind: AiUsageKind): number | null {
	if (isProTier(tier)) {
		return null;
	}
	switch (kind) {
		case 'ai_scan':
			return FREE_LIMITS.aiScansPerMonth;
		case 'receipt_pdf':
			return FREE_LIMITS.receiptPdfParsesPerMonth;
		case 'smart_fill':
			return FREE_LIMITS.smartFillPerWeek;
		case 'admin_insights':
			return FREE_LIMITS.adminInsightsPerWeek;
	}
}
