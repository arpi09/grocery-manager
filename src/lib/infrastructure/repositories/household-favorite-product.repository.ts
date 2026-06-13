import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { householdFavoriteProductTable } from '$lib/infrastructure/db/schema';

export interface HouseholdFavoriteProduct {
	householdId: string;
	normalizedKey: string;
	barcode: string | null;
	displayName: string;
	quantity: string;
	unit: string | null;
	notes: string | null;
	updatedAt: Date;
}

export interface UpsertHouseholdFavoriteProductInput {
	householdId: string;
	normalizedKey: string;
	barcode?: string | null;
	displayName: string;
	quantity: string;
	unit?: string | null;
	notes?: string | null;
}

export interface IHouseholdFavoriteProductRepository {
	findByKey(householdId: string, normalizedKey: string): Promise<HouseholdFavoriteProduct | null>;
	findByBarcode(householdId: string, barcode: string): Promise<HouseholdFavoriteProduct | null>;
	listByHousehold(householdId: string): Promise<HouseholdFavoriteProduct[]>;
	countByHousehold(householdId: string): Promise<number>;
	deleteByKey(householdId: string, normalizedKey: string): Promise<boolean>;
	deleteByBarcode(householdId: string, barcode: string): Promise<boolean>;
	deleteOldest(householdId: string): Promise<boolean>;
	upsert(input: UpsertHouseholdFavoriteProductInput): Promise<HouseholdFavoriteProduct>;
}

function mapRow(row: typeof householdFavoriteProductTable.$inferSelect): HouseholdFavoriteProduct {
	return {
		householdId: row.householdId,
		normalizedKey: row.normalizedKey,
		barcode: row.barcode,
		displayName: row.displayName,
		quantity: row.quantity,
		unit: row.unit,
		notes: row.notes,
		updatedAt: row.updatedAt
	};
}

export class DrizzleHouseholdFavoriteProductRepository implements IHouseholdFavoriteProductRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async findByKey(
		householdId: string,
		normalizedKey: string
	): Promise<HouseholdFavoriteProduct | null> {
		const [row] = await this.database
			.select()
			.from(householdFavoriteProductTable)
			.where(
				and(
					eq(householdFavoriteProductTable.householdId, householdId),
					eq(householdFavoriteProductTable.normalizedKey, normalizedKey)
				)
			)
			.limit(1);

		return row ? mapRow(row) : null;
	}

	async findByBarcode(householdId: string, barcode: string): Promise<HouseholdFavoriteProduct | null> {
		const [row] = await this.database
			.select()
			.from(householdFavoriteProductTable)
			.where(
				and(
					eq(householdFavoriteProductTable.householdId, householdId),
					eq(householdFavoriteProductTable.barcode, barcode)
				)
			)
			.limit(1);

		return row ? mapRow(row) : null;
	}

	async listByHousehold(householdId: string): Promise<HouseholdFavoriteProduct[]> {
		const rows = await this.database
			.select()
			.from(householdFavoriteProductTable)
			.where(eq(householdFavoriteProductTable.householdId, householdId))
			.orderBy(desc(householdFavoriteProductTable.updatedAt));

		return rows.map(mapRow);
	}

	async countByHousehold(householdId: string): Promise<number> {
		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(householdFavoriteProductTable)
			.where(eq(householdFavoriteProductTable.householdId, householdId));

		return row?.count ?? 0;
	}

	async deleteByKey(householdId: string, normalizedKey: string): Promise<boolean> {
		const deleted = await this.database
			.delete(householdFavoriteProductTable)
			.where(
				and(
					eq(householdFavoriteProductTable.householdId, householdId),
					eq(householdFavoriteProductTable.normalizedKey, normalizedKey)
				)
			)
			.returning();

		return deleted.length > 0;
	}

	async deleteByBarcode(householdId: string, barcode: string): Promise<boolean> {
		const deleted = await this.database
			.delete(householdFavoriteProductTable)
			.where(
				and(
					eq(householdFavoriteProductTable.householdId, householdId),
					eq(householdFavoriteProductTable.barcode, barcode)
				)
			)
			.returning();

		return deleted.length > 0;
	}

	async deleteOldest(householdId: string): Promise<boolean> {
		const [oldest] = await this.database
			.select({ normalizedKey: householdFavoriteProductTable.normalizedKey })
			.from(householdFavoriteProductTable)
			.where(eq(householdFavoriteProductTable.householdId, householdId))
			.orderBy(asc(householdFavoriteProductTable.updatedAt))
			.limit(1);

		if (!oldest) {
			return false;
		}

		return this.deleteByKey(householdId, oldest.normalizedKey);
	}

	async upsert(input: UpsertHouseholdFavoriteProductInput): Promise<HouseholdFavoriteProduct> {
		const updatedAt = new Date();
		const [row] = await this.database
			.insert(householdFavoriteProductTable)
			.values({
				householdId: input.householdId,
				normalizedKey: input.normalizedKey,
				barcode: input.barcode ?? null,
				displayName: input.displayName,
				quantity: input.quantity,
				unit: input.unit ?? null,
				notes: input.notes ?? null,
				updatedAt
			})
			.onConflictDoUpdate({
				target: [
					householdFavoriteProductTable.householdId,
					householdFavoriteProductTable.normalizedKey
				],
				set: {
					barcode: input.barcode ?? null,
					displayName: input.displayName,
					quantity: input.quantity,
					unit: input.unit ?? null,
					notes: input.notes ?? null,
					updatedAt
				}
			})
			.returning();

		return mapRow(row);
	}
}
