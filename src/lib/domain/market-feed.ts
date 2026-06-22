export interface MarketSharePreviewItem {
	expiresOn: string | null;
}

export function earliestExpiryOn(items: MarketSharePreviewItem[]): string | null {
	let earliest: string | null = null;

	for (const item of items) {
		const value = item.expiresOn?.trim();
		if (!value) {
			continue;
		}
		if (!earliest || value < earliest) {
			earliest = value;
		}
	}

	return earliest;
}

export function sortNearbySharesByExpiry<
	T extends { previewItems: MarketSharePreviewItem[]; approximateDistanceM: number }
>(shares: T[]): T[] {
	return [...shares].sort((left, right) => {
		const leftExpiry = earliestExpiryOn(left.previewItems);
		const rightExpiry = earliestExpiryOn(right.previewItems);

		if (leftExpiry && rightExpiry && leftExpiry !== rightExpiry) {
			return leftExpiry.localeCompare(rightExpiry);
		}
		if (leftExpiry && !rightExpiry) {
			return -1;
		}
		if (!leftExpiry && rightExpiry) {
			return 1;
		}

		return left.approximateDistanceM - right.approximateDistanceM;
	});
}
