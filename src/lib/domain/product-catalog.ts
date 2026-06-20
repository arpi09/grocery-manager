export type ProductCatalogSource = 'open_food_facts';

export interface ProductCatalogEntry {
	barcode: string;
	name: string;
	imageUrl: string | null;
	source: ProductCatalogSource;
	updatedAt: Date;
}

export interface UpsertProductCatalogInput {
	barcode: string;
	name: string;
	imageUrl?: string | null;
	source?: ProductCatalogSource;
}
