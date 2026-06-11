export const PRICE_MEMORY_WINDOW_DAYS = 365;

export interface LastPaidPrice {
	normalizedKey: string;
	unitPrice: string;
	currency: string;
	lineTotal: string | null;
	storeLabel: string | null;
	purchasedAt: Date;
}
