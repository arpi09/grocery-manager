import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';

const HEURISTIC_DAYS: Record<string, number> = {
	mjölk: 7,
	milk: 7,
	yoghurt: 14,
	bröd: 5,
	bread: 5
};

function addDaysIso(from: Date, days: number): string {
	const date = new Date(from);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

export function guessShelfLife(name: string, location: StorageLocation) {
	const normalized = name.toLowerCase();
	const freezerBonus = location === 'freezer' ? 90 : 0;
	for (const [keyword, days] of Object.entries(HEURISTIC_DAYS)) {
		if (normalized.includes(keyword)) {
			return {
				expiresOn: addDaysIso(new Date(), days + freezerBonus),
				source: 'ai_inferred' as ExpiresOnSource
			};
		}
	}
	return null;
}
