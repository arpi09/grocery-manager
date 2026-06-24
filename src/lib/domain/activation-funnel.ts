import { funnelRate } from '$lib/domain/pmf-funnel';

export const ACTIVATION_FUNNEL_PERIOD_OPTIONS = [7, 30] as const;
export type ActivationFunnelPeriodDays = (typeof ACTIVATION_FUNNEL_PERIOD_OPTIONS)[number];

export const ACTIVATION_FUNNEL_PERIOD_DAYS: ActivationFunnelPeriodDays = 7;

/** Funnel step: inventory items within 24h of signup (early PMF signal). */
export const ACTIVATION_FUNNEL_INVENTORY_THRESHOLD = 5;

export const ACTIVATION_FUNNEL_TARGETS = {
	onboardingFromSignup: 0.8,
	receiptParsed24hFromSignup: 0.4,
	inventoryFiveFromSignup: 0.3,
	recipesFromReceiptUsers: 0.5,
	d7Retention: 0.15
} as const;

export interface ActivationFunnelCohortUser {
	userId: string;
	registeredAt: Date;
	lastSeenAt: Date | null;
}

export interface ActivationFunnelStepCounts {
	registrations: number;
	onboardingStarted: number;
	receiptParsed24h: number;
	inventoryFivePlus24h: number;
	activationRecipesShown: number;
	d7Retained: number;
	d7Eligible: number;
	sharedListOpened: number;
}

export interface ActivationFunnelRates {
	onboardingFromSignup: number | null;
	receiptParsedFromSignup: number | null;
	inventoryFiveFromSignup: number | null;
	recipesFromReceiptUsers: number | null;
	d7Retention: number | null;
}

export interface ActivationFunnelSnapshot {
	periodDays: ActivationFunnelPeriodDays;
	periodStart: Date;
	periodEnd: Date;
	counts: ActivationFunnelStepCounts;
	rates: ActivationFunnelRates;
}

export function parseActivationFunnelPeriodDays(
	raw: string | number | null | undefined
): ActivationFunnelPeriodDays {
	const parsed = Number(raw ?? ACTIVATION_FUNNEL_PERIOD_DAYS);
	return parsed === 30 ? 30 : 7;
}

export function buildActivationFunnelSnapshot(input: {
	periodDays: ActivationFunnelPeriodDays;
	periodStart: Date;
	periodEnd: Date;
	cohortUsers: ActivationFunnelCohortUser[];
	onboardingStartedUserIds: Set<string>;
	receiptParsed24hUserIds: Set<string>;
	inventoryFivePlus24hUserIds: Set<string>;
	activationRecipesShownUserIds: Set<string>;
	d7Retained: number;
	d7Eligible: number;
	sharedListOpened: number;
}): ActivationFunnelSnapshot {
	const registrations = input.cohortUsers.length;
	const receiptParsed24h = input.receiptParsed24hUserIds.size;
	const activationRecipesShown = input.activationRecipesShownUserIds.size;

	const counts: ActivationFunnelStepCounts = {
		registrations,
		onboardingStarted: input.onboardingStartedUserIds.size,
		receiptParsed24h,
		inventoryFivePlus24h: input.inventoryFivePlus24hUserIds.size,
		activationRecipesShown,
		d7Retained: input.d7Retained,
		d7Eligible: input.d7Eligible,
		sharedListOpened: input.sharedListOpened
	};

	const rates: ActivationFunnelRates = {
		onboardingFromSignup: funnelRate(counts.onboardingStarted, registrations),
		receiptParsedFromSignup: funnelRate(receiptParsed24h, registrations),
		inventoryFiveFromSignup: funnelRate(counts.inventoryFivePlus24h, registrations),
		recipesFromReceiptUsers: funnelRate(activationRecipesShown, receiptParsed24h),
		d7Retention: input.d7Eligible > 0 ? input.d7Retained / input.d7Eligible : null
	};

	return {
		periodDays: input.periodDays,
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		counts,
		rates
	};
}
