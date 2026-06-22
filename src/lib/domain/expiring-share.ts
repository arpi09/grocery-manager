export const EXPIRING_SHARE_TTL_MS = 48 * 60 * 60 * 1000;
export const EXPIRING_SHARE_PRO_TTL_MS = 72 * 60 * 60 * 1000;

export type ExpiringSharePricingMode = 'free' | 'percent_of_reference' | 'fixed';

export type ExpiringShareReferencePriceSource = 'price_memory' | 'manual' | 'none';

export interface ExpiringShareItemSnapshot {
	name: string;
	expiresOn: string | null;
	location: 'fridge' | 'freezer' | 'cupboard';
	quantity: string;
	unit: string | null;
	portionPercent?: number;
	portionNote?: string;
	referencePriceSek?: number;
	referencePriceSource?: ExpiringShareReferencePriceSource;
	askingPriceSek?: number;
	pricePercent?: number;
	pricingMode?: ExpiringSharePricingMode;
}

export interface ExpiringShareSnapshot {
	items: ExpiringShareItemSnapshot[];
	createdAt: string;
}

export interface ExpiringSharePreview {
	items: ExpiringShareItemSnapshot[];
	expiresAt: Date;
	createdAt: Date;
}

export interface NearbySharingSettings {
	enabled: boolean;
	latitude: number | null;
	longitude: number | null;
	updatedAt: Date | null;
}

export interface NearbyExpiringShare {
	id: string;
	itemCount: number;
	previewItems: Pick<
		ExpiringShareItemSnapshot,
		'name' | 'expiresOn' | 'quantity' | 'unit' | 'portionPercent' | 'askingPriceSek' | 'pricingMode'
	>[];
	approximateDistanceM: number;
	mapLat: number;
	mapLng: number;
	openPath: string;
	expiresAt: Date;
	createdAt: Date;
}

export type ExpiringShareReportReason = 'inappropriate' | 'spam' | 'safety' | 'other';

export interface ExpiringShareReportInput {
	shareId?: string;
	token?: string;
	blockHousehold?: boolean;
	reason?: ExpiringShareReportReason;
}
