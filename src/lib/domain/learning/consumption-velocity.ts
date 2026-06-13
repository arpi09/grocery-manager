import { daysBetweenIso } from '$lib/domain/learning/shelf-life-learning';

/** Minimum days finished before estimated expiry for a strong shorter-shelf-life signal. */
export const CONSUMPTION_VELOCITY_MIN_EARLY_DAYS = 2;

/** Minimum days after estimated expiry before a weak longer-shelf-life signal. */
export const CONSUMPTION_VELOCITY_MIN_LATE_DAYS = 1;

export type ConsumptionVelocityStrength = 'strong' | 'weak';

export interface ConsumptionVelocitySample {
	typicalDays: number;
	strength: ConsumptionVelocityStrength;
}

/**
 * Derives implicit shelf-life days from purchase → consume timing vs estimated expiry.
 * Returns null when the timing delta is not meaningful enough to learn from.
 */
export function computeTypicalDaysFromPurchaseAndConsume(
	purchasedAt: string,
	consumedAt: string,
	expiresOn: string
): ConsumptionVelocitySample | null {
	const typicalDays = daysBetweenIso(purchasedAt, consumedAt);
	const predictedTypicalDays = daysBetweenIso(purchasedAt, expiresOn);

	if (typicalDays < 0) return null;

	const earlyMargin = predictedTypicalDays - typicalDays;
	if (earlyMargin >= CONSUMPTION_VELOCITY_MIN_EARLY_DAYS) {
		return { typicalDays, strength: 'strong' };
	}

	const lateMargin = typicalDays - predictedTypicalDays;
	if (lateMargin >= CONSUMPTION_VELOCITY_MIN_LATE_DAYS) {
		return { typicalDays, strength: 'weak' };
	}

	return null;
}
