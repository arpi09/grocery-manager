import type { BarcodeProduct } from '$lib/domain/barcode-product';
import type {
	ProductCatalogEntry,
	UpsertProductCatalogInput
} from '$lib/domain/product-catalog';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { productCatalogTable } from '$lib/infrastructure/db/schema';
import { inArray } from 'drizzle-orm';

export interface IProductCatalogRepository {
	upsert(input: UpsertProductCatalogInput): Promise<ProductCatalogEntry>;
	findByBarcodes(barcodes: string[]): Promise<ProductCatalogEntry[]>;
}

function mapRow(row: typeof productCatalogTable.$inferSelect): ProductCatalogEntry {
	return {
		barcode: row.barcode,
		name: row.name,
		imageUrl: row.imageUrl,
		source: row.source,
		updatedAt: row.updatedAt
	};
}

export class DrizzleProductCatalogRepository implements IProductCatalogRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async upsert(input: UpsertProductCatalogInput): Promise<ProductCatalogEntry> {
		const now = new Date();
		const [row] = await this.database
			.insert(productCatalogTable)
			.values({
				barcode: input.barcode,
				name: input.name,
				imageUrl: input.imageUrl ?? null,
				source: input.source ?? 'open_food_facts',
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: productCatalogTable.barcode,
				set: {
					name: input.name,
					...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
					source: input.source ?? 'open_food_facts',
					updatedAt: now
				}
			})
			.returning();

		return mapRow(row);
	}

	async findByBarcodes(barcodes: string[]): Promise<ProductCatalogEntry[]> {
		const normalized = [...new Set(barcodes.map((code) => code.replace(/\D/g, '')).filter(Boolean))];
		if (normalized.length === 0) {
			return [];
		}

		const rows = await this.database
			.select()
			.from(productCatalogTable)
			.where(inArray(productCatalogTable.barcode, normalized));

		return rows.map(mapRow);
	}
}

export function upsertInputFromBarcodeProduct(product: BarcodeProduct): UpsertProductCatalogInput {
	return {
		barcode: product.barcode,
		name: product.name,
		imageUrl: product.imageUrl ?? null,
		source: 'open_food_facts'
	};
}
