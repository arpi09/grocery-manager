import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';

export interface BarcodeProduct {
	barcode: string;
	name: string;
	quantity: string;
	unit: string | null;
	notes: string | null;
}

export interface BarcodeLookupResult {
	found: boolean;
	product: BarcodeProduct;
}

export function unknownBarcodeProductName(
	barcode: string,
	locale: Locale = DEFAULT_LOCALE
): string {
	const normalized = barcode.replace(/\D/g, '');
	return translate(locale, 'item.unknownProductName', {
		barcode: normalized || barcode
	});
}
