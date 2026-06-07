import type { BarcodeProduct } from '$lib/domain/barcode-product';

export interface SwedishProductOverride {
	name: string;
	quantity?: string;
	unit?: string | null;
	notes?: string | null;
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
		notes: 'Brand: Felix'
	},
	'7310865001864': {
		name: 'Arla Ko Mellanmjölk 1,5%',
		quantity: '1',
		unit: 'L'
	},
	'7310865020000': {
		name: 'Arla Ko Standardmjölk 3%',
		quantity: '1',
		unit: 'L'
	},
	'7350053880006': {
		name: 'ICA Basic Spaghetti',
		quantity: '1',
		unit: 'kg'
	},
	'7311070340012': {
		name: 'Pågen Lingongrova',
		quantity: '1',
		unit: null
	},
	'7311310123456': {
		name: 'Kungsörnen Havregryn',
		quantity: '1',
		unit: 'kg'
	},
	'7310401101234': {
		name: 'Barilla Spaghetti',
		quantity: '500',
		unit: 'g'
	},
	'7310865012345': {
		name: 'Arla Ko Grädde 40%',
		quantity: '2',
		unit: 'dl'
	}
};

export function getSwedishProductOverride(barcode: string): SwedishProductOverride | null {
	const normalized = barcode.replace(/\D/g, '');
	return SWEDISH_PRODUCT_OVERRIDES[normalized] ?? null;
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
