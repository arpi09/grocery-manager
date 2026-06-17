export const PRICE_MEMORY_WINDOW_DAYS = 365;

export interface LastPaidPrice {
	normalizedKey: string;
	unitPrice: string;
	currency: string;
	lineTotal: string | null;
	storeLabel: string | null;
	purchasedAt: Date;
}

export type MatchedLevel = 'raw' | 'normalized_product' | 'household_concept';

export interface PurchaseMemorySummary {
	displayName: string;
	matchedLevel: MatchedLevel;
	lastPaid: LastPaidPrice | null;
	purchaseCount: number;
	retailerCount: number;
	conceptKey: string;
	normalizedKey: string;
}

export interface PurchaseMemoryTimelineEntry {
	purchasedAt: Date;
	unitPrice: string | null;
	currency: string;
	storeLabel: string | null;
	productName: string;
}

export interface PurchaseMemorySearchResult {
	displayName: string;
	matchedLevel: MatchedLevel;
	conceptKey: string;
	normalizedKey: string;
	purchaseCount: number;
	retailerCount: number;
	lastPaid: LastPaidPrice | null;
}
