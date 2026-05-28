import type { BarcodeProduct } from '$lib/domain/barcode-product';
import { fetchProductByBarcode } from '$lib/infrastructure/barcode/open-food-facts.client';

export class BarcodeNotFoundError extends Error {
	constructor() {
		super('No product found for this barcode');
		this.name = 'BarcodeNotFoundError';
	}
}

export class BarcodeLookupService {
	async lookup(barcode: string): Promise<BarcodeProduct> {
		const product = await fetchProductByBarcode(barcode);
		if (!product) {
			throw new BarcodeNotFoundError();
		}
		return product;
	}
}
