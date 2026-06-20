import type { BarcodeProduct } from '$lib/domain/barcode-product';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { IProductCatalogRepository } from '$lib/infrastructure/repositories/product-catalog.repository';
import { upsertInputFromBarcodeProduct } from '$lib/infrastructure/repositories/product-catalog.repository';

export class ProductCatalogService {
	constructor(private readonly repository: IProductCatalogRepository) {}

	async upsertFromBarcodeProduct(product: BarcodeProduct): Promise<void> {
		await this.repository.upsert(upsertInputFromBarcodeProduct(product));
	}

	async enrichInventoryItems<T extends Pick<InventoryItem, 'barcode'>>(items: T[]): Promise<(T & { imageUrl: string | null })[]> {
		const barcodes = [
			...new Set(
				items
					.map((item) => item.barcode?.replace(/\D/g, '') ?? '')
					.filter((code) => code.length >= 8)
			)
		];

		if (barcodes.length === 0) {
			return items.map((item) => ({ ...item, imageUrl: null }));
		}

		const catalogEntries = await this.repository.findByBarcodes(barcodes);
		const imageByBarcode = new Map(
			catalogEntries
				.filter((entry) => entry.imageUrl)
				.map((entry) => [entry.barcode, entry.imageUrl as string])
		);

		return items.map((item) => {
			const normalized = item.barcode?.replace(/\D/g, '') ?? '';
			return {
				...item,
				imageUrl: normalized ? (imageByBarcode.get(normalized) ?? null) : null
			};
		});
	}
}
