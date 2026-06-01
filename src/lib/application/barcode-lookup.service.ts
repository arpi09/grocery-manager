import {
	type BarcodeLookupResult,
	type BarcodeProduct,
	unknownBarcodeProductName
} from '$lib/domain/barcode-product';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import { fetchProductByBarcode } from '$lib/infrastructure/barcode/open-food-facts.client';
import {
	applySwedishProductOverride,
	getSwedishProductOverride,
	swedishOverrideToProduct
} from '$lib/infrastructure/barcode/swedish-product-overrides';

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

	async lookupWithFallback(
		barcode: string,
		locale: Locale = DEFAULT_LOCALE
	): Promise<BarcodeLookupResult> {
		const normalized = barcode.replace(/\D/g, '');
		if (normalized.length < 8) {
			throw new BarcodeNotFoundError();
		}

		const override = locale === 'sv' ? getSwedishProductOverride(normalized) : null;
		const offProduct = await fetchProductByBarcode(normalized, locale);

		if (offProduct) {
			return {
				found: true,
				product: override ? applySwedishProductOverride(offProduct, override) : offProduct
			};
		}

		if (override) {
			return {
				found: true,
				product: swedishOverrideToProduct(normalized, override)
			};
		}

		return {
			found: false,
			product: {
				barcode: normalized,
				name: unknownBarcodeProductName(normalized, locale),
				quantity: '1',
				unit: null,
				notes: null
			}
		};
	}
}
