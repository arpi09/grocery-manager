import { and, eq, gte, lte, sql } from 'drizzle-orm';
import type { StorageLocation } from '$lib/domain/location';
import type {
	CreateInventoryItemInput,
	InventoryItem,
	LocationCount,
	UpdateInventoryItemInput
} from '$lib/domain/inventory-item';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';

export interface IInventoryRepository {
	findById(householdId: string, id: string): Promise<InventoryItem | null>;
	findByHouseholdAndLocation(
		householdId: string,
		location: StorageLocation
	): Promise<InventoryItem[]>;
	findAllByHousehold(householdId: string): Promise<InventoryItem[]>;
	findExpiringBefore(householdId: string, beforeDate: string): Promise<InventoryItem[]>;
	countByLocation(householdId: string): Promise<LocationCount[]>;
	create(
		householdId: string,
		userId: string,
		id: string,
		input: CreateInventoryItemInput
	): Promise<InventoryItem>;
	update(
		householdId: string,
		id: string,
		input: UpdateInventoryItemInput
	): Promise<InventoryItem | null>;
	delete(householdId: string, id: string): Promise<boolean>;
}

function mapRow(row: typeof inventoryItemTable.$inferSelect): InventoryItem {
	return {
		id: row.id,
		householdId: row.householdId,
		userId: row.userId,
		name: row.name,
		location: row.location as StorageLocation,
		quantity: row.quantity,
		unit: row.unit,
		expiresOn: row.expiresOn,
		notes: row.notes,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export class DrizzleInventoryRepository implements IInventoryRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async findById(householdId: string, id: string) {
		const [row] = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(eq(inventoryItemTable.id, id), eq(inventoryItemTable.householdId, householdId))
			)
			.limit(1);

		return row ? mapRow(row) : null;
	}

	async findByHouseholdAndLocation(householdId: string, location: StorageLocation) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location)
				)
			)
			.orderBy(inventoryItemTable.name);

		return rows.map(mapRow);
	}

	async findAllByHousehold(householdId: string) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(eq(inventoryItemTable.householdId, householdId))
			.orderBy(inventoryItemTable.name);

		return rows.map(mapRow);
	}

	async findExpiringBefore(householdId: string, beforeDate: string) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					sql`${inventoryItemTable.expiresOn} is not null`,
					lte(inventoryItemTable.expiresOn, beforeDate),
					gte(inventoryItemTable.expiresOn, new Date().toISOString().slice(0, 10))
				)
			)
			.orderBy(inventoryItemTable.expiresOn);

		return rows.map(mapRow);
	}

	async countByLocation(householdId: string) {
		const rows = await this.database
			.select({
				location: inventoryItemTable.location,
				count: sql<number>`count(*)::int`
			})
			.from(inventoryItemTable)
			.where(eq(inventoryItemTable.householdId, householdId))
			.groupBy(inventoryItemTable.location);

		return rows.map((row) => ({
			location: row.location as StorageLocation,
			count: row.count
		}));
	}

	async create(householdId: string, userId: string, id: string, input: CreateInventoryItemInput) {
		const now = new Date();
		const [row] = await this.database
			.insert(inventoryItemTable)
			.values({
				id,
				householdId,
				userId,
				name: input.name,
				location: input.location,
				quantity: input.quantity,
				unit: input.unit ?? null,
				expiresOn: input.expiresOn ?? null,
				notes: input.notes ?? null,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return mapRow(row);
	}

	async update(householdId: string, id: string, input: UpdateInventoryItemInput) {
		const [row] = await this.database
			.update(inventoryItemTable)
			.set({
				...(input.name !== undefined && { name: input.name }),
				...(input.location !== undefined && { location: input.location }),
				...(input.quantity !== undefined && { quantity: input.quantity }),
				...(input.unit !== undefined && { unit: input.unit }),
				...(input.expiresOn !== undefined && { expiresOn: input.expiresOn }),
				...(input.notes !== undefined && { notes: input.notes }),
				updatedAt: new Date()
			})
			.where(
				and(eq(inventoryItemTable.id, id), eq(inventoryItemTable.householdId, householdId))
			)
			.returning();

		return row ? mapRow(row) : null;
	}

	async delete(householdId: string, id: string) {
		const result = await this.database
			.delete(inventoryItemTable)
			.where(
				and(eq(inventoryItemTable.id, id), eq(inventoryItemTable.householdId, householdId))
			)
			.returning();

		return result.length > 0;
	}
}
