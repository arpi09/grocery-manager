/** Heuristic SEK/kg estimates for Swedish groceries (v1 — no price API). */

const DEFAULT_SEK = 35;
const DEFAULT_KG = 0.35;

type CategoryRule = {
	patterns: RegExp[];
	sek: number;
	kg: number;
};

const CATEGORY_RULES: CategoryRule[] = [
	{ patterns: [/kött|kyckling|fläsk|nöt|lamm|korv|bacon|färs/i], sek: 89, kg: 0.5 },
	{ patterns: [/fisk|lax|torsk|räk|skaldjur/i], sek: 95, kg: 0.4 },
	{ patterns: [/ost|cheddar|mozzarella|feta|brie/i], sek: 55, kg: 0.25 },
	{ patterns: [/mjölk|grädde|yoghurt|fil|crème|keso/i], sek: 28, kg: 0.5 },
	{ patterns: [/ägg/i], sek: 45, kg: 0.3 },
	{ patterns: [/bröd|limpa|fralla|tortilla|wrap/i], sek: 32, kg: 0.4 },
	{ patterns: [/pasta|ris|nudel|bulgur|couscous/i], sek: 25, kg: 0.5 },
	{ patterns: [/frukt|äpple|banan|citron|bär|druv/i], sek: 22, kg: 0.35 },
	{ patterns: [/grönsak|tomat|gurka|sallad|potatis|lök|morot|paprika|broccoli/i], sek: 18, kg: 0.4 },
	{ patterns: [/smör|margarin|olja/i], sek: 42, kg: 0.25 },
	{ patterns: [/kaffe|te/i], sek: 65, kg: 0.2 },
	{ patterns: [/dryck|juice|läsk|vatten/i], sek: 18, kg: 1 }
];

function matchCategory(productName: string): CategoryRule | null {
	const normalized = productName.trim();
	if (!normalized) {
		return null;
	}

	for (const rule of CATEGORY_RULES) {
		if (rule.patterns.some((pattern) => pattern.test(normalized))) {
			return rule;
		}
	}

	return null;
}

export function estimateItemValueSek(productName: string): number {
	return matchCategory(productName)?.sek ?? DEFAULT_SEK;
}

export function estimateItemWeightKg(productName: string): number {
	return matchCategory(productName)?.kg ?? DEFAULT_KG;
}

export interface SavingsReport {
	hasData: boolean;
	consumedCount: number;
	wastedCount: number;
	savedSek: number;
	savedKg: number;
	wastedSek: number;
	wastedKg: number;
	netSek: number;
}

export function buildSavingsReport(
	events: Array<{ productName: string; eventType: 'consumed' | 'discarded' | 'expired' }>
): SavingsReport {
	let consumedCount = 0;
	let wastedCount = 0;
	let savedSek = 0;
	let savedKg = 0;
	let wastedSek = 0;
	let wastedKg = 0;

	for (const event of events) {
		const sek = estimateItemValueSek(event.productName);
		const kg = estimateItemWeightKg(event.productName);

		if (event.eventType === 'consumed') {
			consumedCount += 1;
			savedSek += sek;
			savedKg += kg;
		} else {
			wastedCount += 1;
			wastedSek += sek;
			wastedKg += kg;
		}
	}

	return {
		hasData: events.length > 0,
		consumedCount,
		wastedCount,
		savedSek: Math.round(savedSek),
		savedKg: Math.round(savedKg * 10) / 10,
		wastedSek: Math.round(wastedSek),
		wastedKg: Math.round(wastedKg * 10) / 10,
		netSek: Math.round(savedSek - wastedSek)
	};
}
