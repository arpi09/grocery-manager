import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';

const HEURISTIC_DAYS: Record<string, number> = {
	mjölk: 7,
	milk: 7,
	grädde: 5,
	cream: 5,
	yoghurt: 14,
	yogurt: 14,
	ost: 21,
	cheese: 21,
	ägg: 21,
	egg: 21,
	äg: 21,
	bröd: 5,
	bread: 5,
	bulle: 3,
	bagett: 3,
	färs: 2,
	ground: 2,
	kyckling: 3,
	chicken: 3,
	fläsk: 3,
	pork: 3,
	nöt: 3,
	beef: 3,
	fisk: 2,
	fish: 2,
	lax: 2,
	salmon: 2,
	sallad: 5,
	salad: 5,
	tomater: 7,
	tomato: 7,
	gurka: 7,
	cucumber: 7,
	paprika: 7,
	pepper: 7,
	banan: 5,
	banana: 5,
	äpple: 14,
	apple: 14,
	pasta: 365,
	ris: 365,
	rice: 365,
	havre: 180,
	oats: 180,
	müsli: 180,
	muesli: 180,
	konserver: 730,
	canned: 730,
	sylt: 90,
	jam: 90,
	smör: 30,
	butter: 30,
	juice: 7,
	saft: 7,
	kefir: 14,
	cottage: 10,
	quark: 10,
	hummus: 7,
	tofu: 7,
	soja: 7,
	soy: 7
};

function addDaysIso(from: Date, days: number): string {
	const date = new Date(from);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

function heuristicTypicalDays(name: string, location: StorageLocation): number | null {
	const normalized = name.toLowerCase();
	const freezerBonus = location === 'freezer' ? 90 : 0;
	const cupboardBonus = location === 'cupboard' ? 30 : 0;
	for (const [keyword, days] of Object.entries(HEURISTIC_DAYS)) {
		if (normalized.includes(keyword)) {
			return days + freezerBonus + cupboardBonus;
		}
	}
	return null;
}

export function guessShelfLifeTypicalDays(name: string, location: StorageLocation): number | null {
	return heuristicTypicalDays(name, location);
}

export function guessShelfLife(name: string, location: StorageLocation) {
	const typicalDays = heuristicTypicalDays(name, location);
	if (typicalDays == null) return null;
	return {
		expiresOn: addDaysIso(new Date(), typicalDays),
		source: 'ai_inferred' as ExpiresOnSource
	};
}
