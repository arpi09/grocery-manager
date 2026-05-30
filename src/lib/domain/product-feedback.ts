export const PRODUCT_FEEDBACK_SOURCES = ['settings', 'post_onboarding'] as const;
export type ProductFeedbackSource = (typeof PRODUCT_FEEDBACK_SOURCES)[number];

export const CHURN_REASONS = [
	'forgot_habit',
	'too_much_work',
	'missing_feature',
	'privacy_trust',
	'other_app',
	'notifications',
	'other'
] as const;
export type ChurnReason = (typeof CHURN_REASONS)[number];

export const PRODUCT_FEEDBACK_LIST_DEFAULT = 25;
export const PRODUCT_FEEDBACK_LIST_MAX = 100;

export function isChurnReason(value: string | null | undefined): value is ChurnReason {
	return value != null && (CHURN_REASONS as readonly string[]).includes(value);
}

export function isProductFeedbackSource(value: string): value is ProductFeedbackSource {
	return (PRODUCT_FEEDBACK_SOURCES as readonly string[]).includes(value);
}

export interface ProductFeedbackEntry {
	id: string;
	userId: string;
	userEmail: string;
	householdId: string | null;
	source: ProductFeedbackSource;
	churnReason: ChurnReason | null;
	message: string;
	createdAt: Date;
}

export interface SubmitProductFeedbackInput {
	userId: string;
	householdId: string | null;
	source: ProductFeedbackSource;
	churnReason: ChurnReason | null;
	message: string;
}
