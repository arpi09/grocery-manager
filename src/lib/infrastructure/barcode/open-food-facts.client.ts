import type { BarcodeProduct } from '$lib/domain/barcode-product';
import { resolveOffProductName, type OffProductNameFields } from '$lib/domain/off-product-name';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';

interface OffProductResponse {
	status: number;
	product?: OffProductNameFields & {
		brands?: string;
		quantity?: string;
	};
}

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product';

export async function fetchProductByBarcode(
	barcode: string,
	locale: Locale = DEFAULT_LOCALE
): Promise<BarcodeProduct | null> {
	const normalized = barcode.replace(/\D/g, '');
	if (normalized.length < 8) {
		return null;
	}

	const response = await fetch(`${OFF_API}/${normalized}.json`, {
		headers: { 'User-Agent': 'HomePantry/1.0 (local grocery app)' }
	});

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as OffProductResponse;
	if (data.status !== 1 || !data.product) {
		return null;
	}

	const name = resolveOffProductName(data.product, normalized, locale);

	const { quantity, unit } = parseQuantity(data.product.quantity);
	const brandNote = data.product.brands?.trim();

	return {
		barcode: normalized,
		name,
		quantity,
		unit,
		notes: brandNote ? `Brand: ${brandNote}` : null
	};
}

function parseQuantity(raw?: string): { quantity: string; unit: string | null } {
	if (!raw?.trim()) {
		return { quantity: '1', unit: null };
	}

	const match = raw.trim().match(/^([\d.,]+)\s*(.*)$/);
	if (!match) {
		return { quantity: '1', unit: null };
	}

	const quantity = match[1].replace(',', '.');
	const unit = match[2].trim() || null;
	return { quantity, unit };
}
