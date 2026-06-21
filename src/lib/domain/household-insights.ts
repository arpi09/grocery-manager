import type { InventoryAnalytics } from '$lib/application/inventory.service';
import type { ImpactStats } from '$lib/application/statistik.service';
import type { ReceiptSpendReport } from '$lib/domain/receipt-spend';
import type { SavingsReport } from '$lib/domain/savings-estimate';

export interface PurchaseInsightLine {
	productName: string;
	normalizedKey: string;
	purchasedAt: Date;
	importBatchId: string;
}

export type HouseholdInsightKind =
	| 'top_product'
	| 'shopping_rhythm'
	| 'favorite_store'
	| 'expiring_soon'
	| 'zero_waste_streak'
	| 'planned_meals'
	| 'saved_value'
	| 'pantry_variety';

export interface TopProductInsight {
	kind: 'top_product';
	productName: string;
	purchaseCount: number;
}

export interface ShoppingRhythmInsight {
	kind: 'shopping_rhythm';
	avgDays: number;
	tripCount: number;
}

export interface FavoriteStoreInsight {
	kind: 'favorite_store';
	storeLabel: string;
	sharePercent: number;
}

export interface ZeroWasteStreakInsight {
	kind: 'zero_waste_streak';
	weeks: number;
}

export interface PlannedMealsInsight {
	kind: 'planned_meals';
	count: number;
}

export interface SavedValueInsight {
	kind: 'saved_value';
	savedSek: number;
	consumedCount: number;
}

export interface PantryVarietyInsight {
	kind: 'pantry_variety';
	distinctProducts: number;
}

export interface ExpiringSoonInsight {
	kind: 'expiring_soon';
	count: number;
}

export type HouseholdInsight =
	| TopProductInsight
	| ShoppingRhythmInsight
	| FavoriteStoreInsight
	| ExpiringSoonInsight
	| ZeroWasteStreakInsight
	| PlannedMealsInsight
	| SavedValueInsight
	| PantryVarietyInsight;

export interface HouseholdInsightsInput {
	purchaseLines: PurchaseInsightLine[];
	spend: ReceiptSpendReport;
	impact: ImpactStats;
	savings: SavingsReport;
	analytics: InventoryAnalytics;
	plannedMealsThisWeek: number;
}

const MAX_HIGHLIGHTS = 5;
const MIN_TOP_PRODUCT_COUNT = 2;
const MIN_TRIPS_FOR_RHYTHM = 2;
const MIN_ZERO_WASTE_WEEKS = 2;
const MIN_DISTINCT_FOR_VARIETY = 8;

export function computeTopProduct(
	lines: Pick<PurchaseInsightLine, 'productName' | 'normalizedKey'>[]
): TopProductInsight | null {
	const counts = new Map<string, { productName: string; count: number }>();

	for (const line of lines) {
		const key = line.normalizedKey.trim() || line.productName.trim().toLowerCase();
		if (!key) continue;

		const existing = counts.get(key);
		if (existing) {
			existing.count += 1;
		} else {
			counts.set(key, { productName: line.productName.trim() || key, count: 1 });
		}
	}

	let top: { productName: string; count: number } | null = null;
	for (const entry of counts.values()) {
		if (!top || entry.count > top.count) {
			top = entry;
		}
	}

	if (!top || top.count < MIN_TOP_PRODUCT_COUNT) {
		return null;
	}

	return {
		kind: 'top_product',
		productName: top.productName,
		purchaseCount: top.count
	};
}

export function computeShoppingRhythm(
	lines: Pick<PurchaseInsightLine, 'purchasedAt' | 'importBatchId'>[]
): ShoppingRhythmInsight | null {
	const batchDates = new Map<string, Date>();

	for (const line of lines) {
		const existing = batchDates.get(line.importBatchId);
		if (!existing || line.purchasedAt.getTime() < existing.getTime()) {
			batchDates.set(line.importBatchId, line.purchasedAt);
		}
	}

	const dates = [...batchDates.values()].sort((a, b) => a.getTime() - b.getTime());
	if (dates.length < MIN_TRIPS_FOR_RHYTHM) {
		return null;
	}

	let totalGapDays = 0;
	for (let index = 1; index < dates.length; index += 1) {
		totalGapDays += (dates[index].getTime() - dates[index - 1].getTime()) / (24 * 60 * 60 * 1000);
	}

	return {
		kind: 'shopping_rhythm',
		avgDays: Math.max(1, Math.round(totalGapDays / (dates.length - 1))),
		tripCount: dates.length
	};
}

export function computeFavoriteStore(spend: ReceiptSpendReport): FavoriteStoreInsight | null {
	const top = spend.topStores[0];
	if (!top || top.sek <= 0) {
		return null;
	}

	const totalSek = spend.topStores.reduce((sum, store) => sum + store.sek, 0);
	const sharePercent = totalSek > 0 ? Math.round((top.sek / totalSek) * 100) : 100;

	return {
		kind: 'favorite_store',
		storeLabel: top.storeLabel,
		sharePercent
	};
}

export function buildHouseholdInsights(input: HouseholdInsightsInput): HouseholdInsight[] {
	const candidates: HouseholdInsight[] = [];

	const topProduct = computeTopProduct(input.purchaseLines);
	if (topProduct) candidates.push(topProduct);

	const rhythm = computeShoppingRhythm(input.purchaseLines);
	if (rhythm) candidates.push(rhythm);

	const favoriteStore = computeFavoriteStore(input.spend);
	if (favoriteStore) candidates.push(favoriteStore);

	if (input.analytics.expiringSoonCount > 0) {
		candidates.push({
			kind: 'expiring_soon',
			count: input.analytics.expiringSoonCount
		});
	}

	if (
		input.impact.hasConsumptionData &&
		input.impact.zeroWasteWeeks != null &&
		input.impact.zeroWasteWeeks >= MIN_ZERO_WASTE_WEEKS
	) {
		candidates.push({
			kind: 'zero_waste_streak',
			weeks: input.impact.zeroWasteWeeks
		});
	}

	if (input.savings.hasData && input.savings.savedSek > 0) {
		candidates.push({
			kind: 'saved_value',
			savedSek: input.savings.savedSek,
			consumedCount: input.savings.consumedCount
		});
	}

	if (input.plannedMealsThisWeek > 0) {
		candidates.push({
			kind: 'planned_meals',
			count: input.plannedMealsThisWeek
		});
	}

	if (input.analytics.distinctProducts >= MIN_DISTINCT_FOR_VARIETY) {
		candidates.push({
			kind: 'pantry_variety',
			distinctProducts: input.analytics.distinctProducts
		});
	}

	return pickHighlightInsights(candidates);
}

export function pickHighlightInsights(
	insights: HouseholdInsight[],
	max = MAX_HIGHLIGHTS
): HouseholdInsight[] {
	const priority: HouseholdInsightKind[] = [
		'top_product',
		'shopping_rhythm',
		'favorite_store',
		'expiring_soon',
		'zero_waste_streak',
		'saved_value',
		'planned_meals',
		'pantry_variety'
	];

	const picked: HouseholdInsight[] = [];
	for (const kind of priority) {
		const match = insights.find((insight) => insight.kind === kind);
		if (match) {
			picked.push(match);
		}
		if (picked.length >= max) {
			break;
		}
	}

	return picked;
}
