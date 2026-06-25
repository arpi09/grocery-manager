import type { StorageLocation } from '$lib/domain/location';

export interface ProductMemoryProfileInput {
	normalizedKey: string;
	shelfLifeRules: Array<{
		location: StorageLocation;
		typicalDays: number;
		sampleCount: number;
	}>;
	locationRules: Array<{
		location: StorageLocation;
		sampleCount: number;
	}>;
	purchaseLines: Array<{
		purchasedAt: Date | null;
		createdAt: Date;
	}>;
}

export interface ProductMemoryProfile {
	normalizedKey: string;
	typicalLocation: StorageLocation | null;
	shelfLifeDays: number | null;
	purchaseCadenceDays: number | null;
	confidence: number;
	shelfLifeSampleCount: number;
	locationSampleCount: number;
	purchaseCount: number;
}

export function buildProductMemoryProfile(input: ProductMemoryProfileInput): ProductMemoryProfile {
	const { normalizedKey, shelfLifeRules, locationRules, purchaseLines } = input;

	const bestShelf = shelfLifeRules.reduce<(typeof shelfLifeRules)[0] | null>((best, rule) => {
		if (!best || rule.sampleCount > best.sampleCount) return rule;
		return best;
	}, null);

	const bestLocation = locationRules.reduce<(typeof locationRules)[0] | null>((best, rule) => {
		if (!best || rule.sampleCount > best.sampleCount) return rule;
		return best;
	}, null);

	let purchaseCadenceDays: number | null = null;
	if (purchaseLines.length >= 2) {
		const sorted = [...purchaseLines]
			.map((line) => line.purchasedAt ?? line.createdAt)
			.sort((a, b) => a.getTime() - b.getTime());
		const gaps: number[] = [];
		for (let i = 1; i < sorted.length; i++) {
			const days = Math.round((sorted[i]!.getTime() - sorted[i - 1]!.getTime()) / 86_400_000);
			if (days > 0) gaps.push(days);
		}
		if (gaps.length > 0) {
			purchaseCadenceDays = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
		}
	}

	const shelfLifeSampleCount = bestShelf?.sampleCount ?? 0;
	const locationSampleCount = bestLocation?.sampleCount ?? 0;
	const purchaseCount = purchaseLines.length;

	const confidence = Math.min(
		1,
		shelfLifeSampleCount * 0.15 + locationSampleCount * 0.1 + Math.min(purchaseCount, 10) * 0.05
	);

	return {
		normalizedKey,
		typicalLocation: bestLocation?.location ?? bestShelf?.location ?? null,
		shelfLifeDays: bestShelf?.typicalDays ?? null,
		purchaseCadenceDays,
		confidence,
		shelfLifeSampleCount,
		locationSampleCount,
		purchaseCount
	};
}
