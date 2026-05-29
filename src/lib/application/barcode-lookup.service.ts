import {
	type BarcodeLookupResult,
	type BarcodeProduct,
	unknownBarcodeProductName
} from '$lib/domain/barcode-product';
import { fetchProductByBarcode } from '$lib/infrastructure/barcode/open-food-facts.client';

export class BarcodeNotFoundError extends Error {
	constructor() {
		super('No product found for this barcode');
		this.name = 'BarcodeNotFoundError';
	}
}

export class BarcodeLookupService {
	async lookup(barcode: string): Promise<BarcodeProduct> {
		const result = await this.lookupWithFallback(barcode);
		if (!result.found) {
			throw new BarcodeNotFoundError();
		}
		return result.product;
	}

	async lookupWithFallback(barcode: string): Promise<BarcodeLookupResult> {
		const normalized = barcode.replace(/\D/g, '');
		if (normalized.length < 8) {
			throw new BarcodeNotFoundError();
		}

		const product = await fetchProductByBarcode(normalized);
		if (product) {
			return { found: true, product };
		}

		return {
			found: false,
			product: {
				barcode: normalized,
				name: unknownBarcodeProductName(normalized),
				quantity: '1',
				unit: null,
				notes: null
			}
		};
	}
}
