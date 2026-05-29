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

export function unknownBarcodeProductName(barcode: string): string {
	const normalized = barcode.replace(/\D/g, '');
	return `Okänd vara (${normalized || barcode})`;
}
