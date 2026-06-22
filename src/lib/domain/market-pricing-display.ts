import type { ExpiringShareItemSnapshot } from '$lib/domain/expiring-share';
import { isFreeListingItem } from '$lib/domain/market-pricing';

export type MarketListingPreviewItem = Pick<
	ExpiringShareItemSnapshot,
	| 'name'
	| 'expiresOn'
	| 'quantity'
	| 'unit'
	| 'portionPercent'
	| 'askingPriceSek'
	| 'pricingMode'
>;

export type MarketPriceFilter = 'all' | 'free' | 'under50';

export function listingItemPriceSek(
	item: Pick<ExpiringShareItemSnapshot, 'pricingMode' | 'askingPriceSek'>
): number | null {
	if (isFreeListingItem(item)) {
		return null;
	}
	const price = item.askingPriceSek;
	return price != null && Number.isFinite(price) ? Math.round(price) : null;
}

export function sharePrimaryPriceSek(items: MarketListingPreviewItem[]): number | null {
	let lowest: number | null = null;

	for (const item of items) {
		const price = listingItemPriceSek(item);
		if (price == null) {
			continue;
		}
		if (lowest == null || price < lowest) {
			lowest = price;
		}
	}

	return lowest;
}

export function shareIsFreeListing(items: MarketListingPreviewItem[]): boolean {
	if (items.length === 0) {
		return true;
	}
	return items.every((item) => isFreeListingItem(item));
}

export function shareMatchesPriceFilter(
	items: MarketListingPreviewItem[],
	filter: MarketPriceFilter
): boolean {
	if (filter === 'all') {
		return true;
	}
	if (filter === 'free') {
		return shareIsFreeListing(items);
	}

	const price = sharePrimaryPriceSek(items);
	return price != null && price > 0 && price < 50;
}

export function formatPortionQuantityLabel(input: {
	quantity: string;
	unit: string | null;
	portionPercent?: number;
}): { quantity: string; unit: string | null } {
	const portion = input.portionPercent;
	if (portion == null || portion >= 100) {
		return { quantity: input.quantity, unit: input.unit };
	}

	const normalized = input.quantity.trim().replace(',', '.');
	const parsed = Number(normalized);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return { quantity: input.quantity, unit: input.unit };
	}

	const adjusted = Math.round(parsed * (portion / 100) * 10) / 10;
	const quantity =
		Number.isInteger(adjusted) ? String(adjusted) : adjusted.toFixed(1).replace(/\.0$/, '');

	return { quantity, unit: input.unit };
}
