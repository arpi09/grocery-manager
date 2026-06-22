import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { computeExpiresOn, formatTodayIso } from '$lib/domain/learning/shelf-life-learning';
import type { StorageLocation } from '$lib/domain/location';

export type ShelfLifeEstimateSource =
	| 'household_rule'
	| 'heuristic'
	| 'location_default'
	| 'ai_inferred';

export interface ShelfLifeEstimate {
	typicalDays: number;
	expiresOn: string;
	source: ShelfLifeEstimateSource;
	confidence: number;
}

/** Low-confidence defaults when no product-specific rule matches. */
export const LOCATION_DEFAULT_TYPICAL_DAYS: Record<StorageLocation, number> = {
	fridge: 5,
	freezer: 90,
	cupboard: 60
};

const ESTIMATE_SOURCE_CONFIDENCE: Record<ShelfLifeEstimateSource, number> = {
	household_rule: 0.85,
	heuristic: 0.55,
	location_default: 0.25,
	ai_inferred: 0.45
};

export function shelfLifeEstimateConfidence(source: ShelfLifeEstimateSource): number {
	return ESTIMATE_SOURCE_CONFIDENCE[source];
}

export function shelfLifeEstimateToExpiresOnSource(
	source: ShelfLifeEstimateSource
): ExpiresOnSource {
	switch (source) {
		case 'household_rule':
			return 'household_learned';
		case 'heuristic':
			return 'heuristic';
		case 'location_default':
			return 'default_heuristic';
		case 'ai_inferred':
			return 'ai_inferred';
	}
}

export function resolveLocationDefaultShelfLife(input: {
	location: StorageLocation;
	purchasedAt: string | null;
	todayIso?: string;
}): ShelfLifeEstimate {
	const todayIso = input.todayIso ?? formatTodayIso();
	const typicalDays = LOCATION_DEFAULT_TYPICAL_DAYS[input.location];
	return {
		typicalDays,
		expiresOn: computeExpiresOn(typicalDays, input.purchasedAt, todayIso),
		source: 'location_default',
		confidence: shelfLifeEstimateConfidence('location_default')
	};
}
