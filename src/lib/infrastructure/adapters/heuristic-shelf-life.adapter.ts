import { guessShelfLifeTypicalDays } from '$lib/domain/shelf-life';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { computeExpiresOn, formatTodayIso } from '$lib/domain/learning/shelf-life-learning';
import type { StorageLocation } from '$lib/domain/location';

export interface HeuristicShelfLifeResult {
	expiresOn: string;
	typicalDays: number;
	source: ExpiresOnSource;
}

export function predictHeuristicShelfLife(input: {
	productName: string;
	location: StorageLocation;
	purchasedAt: string | null;
	todayIso?: string;
	categoryHint?: string | null;
	openedPackage?: boolean;
}): HeuristicShelfLifeResult | null {
	let typicalDays = guessShelfLifeTypicalDays(
		input.productName,
		input.location,
		input.categoryHint
	);
	if (typicalDays == null) return null;
	if (input.openedPackage) {
		typicalDays = Math.max(1, Math.round(typicalDays * 0.4));
	}

	const todayIso = input.todayIso ?? formatTodayIso();
	const expiresOn = computeExpiresOn(typicalDays, input.purchasedAt, todayIso);

	return {
		expiresOn,
		typicalDays,
		source: 'heuristic'
	};
}
