import type { BarcodeProduct } from '$lib/domain/barcode-product';

export type SwedishProductStore = 'ica' | 'willys' | 'coop' | 'other';

export interface SwedishProductOverride {
	name: string;
	quantity?: string;
	unit?: string | null;
	notes?: string | null;
	/** Retail chain hint for PMF metadata (ICA/Willys/Coop top sellers). */
	store?: SwedishProductStore;
}

/**
 * Curated Swedish product names for barcodes where Open Food Facts is missing or English-only.
 * Extend as scan feedback identifies recurring mismatches.
 */
export const SWEDISH_PRODUCT_OVERRIDES: Record<string, SwedishProductOverride> = {
	'7310100683519': {
		name: 'Felix Ketchup',
		quantity: '1',
		unit: null,
		notes: 'Brand: Felix',
		store: 'ica'
	},
	'7310100791413': {
		name: 'Felix Krossade Tomater',
		quantity: '1',
		unit: null,
		notes: 'Brand: Felix',
		store: 'ica'
	},
	'7310865001864': {
		name: 'Arla Ko Mellanmjölk 1,5%',
		quantity: '1',
		unit: 'L',
		store: 'ica'
	},
	'7310865020000': {
		name: 'Arla Ko Standardmjölk 3%',
		quantity: '1',
		unit: 'L',
		store: 'ica'
	},
	'7310865015621': {
		name: 'Arla Ko Laktosfri Mellanmjölk 1,5%',
		quantity: '1',
		unit: 'L',
		store: 'coop'
	},
	'7310865000705': {
		name: 'Arla Ko Vispgrädde 40%',
		quantity: '2',
		unit: 'dl',
		store: 'ica'
	},
	'7350053880006': {
		name: 'ICA Basic Spaghetti',
		quantity: '1',
		unit: 'kg',
		store: 'ica'
	},
	'7300400122719': {
		name: 'ICA Basic Mjölk 3%',
		quantity: '1',
		unit: 'L',
		store: 'ica'
	},
	'7311070340012': {
		name: 'Pågen Lingongrova',
		quantity: '1',
		unit: null,
		store: 'ica'
	},
	'7311310077019': {
		name: 'Kungsörnen Havregryn',
		quantity: '1',
		unit: 'kg',
		store: 'ica'
	},
	'7310400260014': {
		name: 'Barilla Penne Rigate',
		quantity: '500',
		unit: 'g',
		store: 'willys'
	},
	'7310400577012': {
		name: 'Garant Bacon',
		quantity: '140',
		unit: 'g',
		store: 'willys'
	},
	'7310400063134': {
		name: 'Coop Ägg 12-pack M/L',
		quantity: '12',
		unit: 'st',
		store: 'coop'
	},
	'7300400473012': {
		name: 'Coop Pasta Penne',
		quantity: '500',
		unit: 'g',
		store: 'coop'
	},
	'7310400337015': {
		name: 'Garant Kycklingfilé',
		quantity: '1',
		unit: 'kg',
		store: 'willys'
	},
	'7350043512719': {
		name: 'ICA Basic Havregryn',
		quantity: '1',
		unit: 'kg',
		store: 'ica'
	}
};

export function getSwedishProductOverride(barcode: string): SwedishProductOverride | null {
	const normalized = barcode.replace(/\D/g, '');
	return SWEDISH_PRODUCT_OVERRIDES[normalized] ?? null;
}

export function listSwedishOverrideBarcodes(): string[] {
	return Object.keys(SWEDISH_PRODUCT_OVERRIDES).sort();
}

export function applySwedishProductOverride(
	product: BarcodeProduct,
	override: SwedishProductOverride
): BarcodeProduct {
	return {
		...product,
		name: override.name,
		quantity: override.quantity ?? product.quantity,
		unit: override.unit !== undefined ? override.unit : product.unit,
		notes: override.notes !== undefined ? override.notes : product.notes
	};
}

export function swedishOverrideToProduct(
	barcode: string,
	override: SwedishProductOverride
): BarcodeProduct {
	return {
		barcode,
		name: override.name,
		quantity: override.quantity ?? '1',
		unit: override.unit ?? null,
		notes: override.notes ?? null
	};
}
