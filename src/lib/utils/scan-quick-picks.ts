import { getFavoriteProducts, type FavoriteProduct } from '$lib/utils/favorite-products';
import { getRecentScans, type RecentScan } from '$lib/utils/recent-scans';

export interface ScanQuickPick {
	barcode: string;
	name: string;
	quantity: string;
	unit: string | null;
	source: 'favorite' | 'recent';
}

const MAX_QUICK_PICKS = 8;

function fromFavorite(product: FavoriteProduct): ScanQuickPick {
	return {
		barcode: product.barcode,
		name: product.name,
		quantity: product.quantity,
		unit: product.unit,
		source: 'favorite'
	};
}

function fromRecent(scan: RecentScan, favorite?: FavoriteProduct | null): ScanQuickPick {
	return {
		barcode: scan.barcode,
		name: favorite?.name ?? scan.name,
		quantity: favorite?.quantity ?? '1',
		unit: favorite?.unit ?? null,
		source: favorite ? 'favorite' : 'recent'
	};
}

export function getScanQuickPicks(): ScanQuickPick[] {
	const favorites = getFavoriteProducts();
	const recent = getRecentScans();
	const favoriteByBarcode = new Map(favorites.map((p) => [p.barcode, p]));
	const seen = new Set<string>();
	const picks: ScanQuickPick[] = [];

	for (const favorite of favorites) {
		if (seen.has(favorite.barcode)) {
			continue;
		}
		seen.add(favorite.barcode);
		picks.push(fromFavorite(favorite));
		if (picks.length >= MAX_QUICK_PICKS) {
			return picks;
		}
	}

	for (const scan of recent) {
		if (seen.has(scan.barcode)) {
			continue;
		}
		seen.add(scan.barcode);
		picks.push(fromRecent(scan, favoriteByBarcode.get(scan.barcode)));
		if (picks.length >= MAX_QUICK_PICKS) {
			break;
		}
	}

	return picks;
}
