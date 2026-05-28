import type { BarcodeProduct } from '$lib/domain/barcode-product';

interface OffProductResponse {
	status: number;
	product?: {
		product_name?: string;
		product_name_en?: string;
		brands?: string;
		quantity?: string;
	};
}

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product';

export async function fetchProductByBarcode(barcode: string): Promise<BarcodeProduct | null> {
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

	const name =
		data.product.product_name?.trim() ||
		data.product.product_name_en?.trim() ||
		`Product ${normalized}`;

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
