import { and, eq, gt, gte, isNull, lte, sql } from 'drizzle-orm';
import { EXPIRING_SOON_DAYS } from '$lib/domain/inventory-analytics';
import type { StorageLocation } from '$lib/domain/location';
import type {
	CreateInventoryItemInput,
	InventoryItem,
	LocationCount,
	UpdateInventoryItemInput
} from '$lib/domain/inventory-item';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';

export interface InventoryAnalyticsSnapshot {
	totalItems: number;
	totalQuantity: string;
	distinctProducts: number;
	expiringSoonCount: number;
	withoutExpiryCount: number;
	lowStockCount: number;
	addedLast7Days: number;
	byLocation: LocationCount[];
}

export interface IInventoryRepository {
	findById(householdId: string, id: string): Promise<InventoryItem | null>;
	findByHouseholdAndLocation(
		householdId: string,
		location: StorageLocation
	): Promise<InventoryItem[]>;
	findFinishedByHouseholdAndLocation(
		householdId: string,
		location: StorageLocation
	): Promise<InventoryItem[]>;
	findAllByHousehold(householdId: string): Promise<InventoryItem[]>;
	findExpiringBefore(householdId: string, beforeDate: string): Promise<InventoryItem[]>;
	countByLocation(householdId: string): Promise<LocationCount[]>;
	getAnalytics(householdId: string): Promise<InventoryAnalyticsSnapshot>;
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

function activeQuantityFilter() {
	return gt(inventoryItemTable.quantity, '0');
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
					eq(inventoryItemTable.location, location),
					activeQuantityFilter()
				)
			)
			.orderBy(inventoryItemTable.name);

		return rows.map(mapRow);
	}

	async findFinishedByHouseholdAndLocation(householdId: string, location: StorageLocation) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location),
					sql`${inventoryItemTable.quantity} <= 0`
				)
			)
			.orderBy(inventoryItemTable.updatedAt);

		return rows.map(mapRow);
	}

	async findAllByHousehold(householdId: string) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(and(eq(inventoryItemTable.householdId, householdId), activeQuantityFilter()))
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
					activeQuantityFilter(),
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
			.where(and(eq(inventoryItemTable.householdId, householdId), activeQuantityFilter()))
			.groupBy(inventoryItemTable.location);

		return rows.map((row) => ({
			location: row.location as StorageLocation,
			count: row.count
		}));
	}


	async getAnalytics(householdId: string): Promise<InventoryAnalyticsSnapshot> {
		const today = new Date().toISOString().slice(0, 10);
		const expiringBefore = addDaysIso(today, EXPIRING_SOON_DAYS);
		const createdSince = addDays(new Date(), -7);
		const householdFilter = and(
			eq(inventoryItemTable.householdId, householdId),
			activeQuantityFilter()
		);

		const [totalsRow] = await this.database
			.select({
				totalItems: sql<number>`count(*)::int`,
				totalQuantity: sql<string>`coalesce(sum(${inventoryItemTable.quantity}), '0')`,
				distinctProducts: sql<number>`count(distinct lower(${inventoryItemTable.name}))::int`
			})
			.from(inventoryItemTable)
			.where(householdFilter);

		const [expiringRow] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(inventoryItemTable)
			.where(
				and(
					householdFilter,
					sql`${inventoryItemTable.expiresOn} is not null`,
					lte(inventoryItemTable.expiresOn, expiringBefore),
					gte(inventoryItemTable.expiresOn, today)
				)
			);

		const [withoutExpiryRow] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(inventoryItemTable)
			.where(and(householdFilter, isNull(inventoryItemTable.expiresOn)));

		const [lowStockRow] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(inventoryItemTable)
			.where(and(householdFilter, sql`${inventoryItemTable.quantity} < 1`));

		const [addedRow] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(inventoryItemTable)
			.where(and(householdFilter, gte(inventoryItemTable.createdAt, createdSince)));

		const byLocation = await this.countByLocation(householdId);

		return {
			totalItems: totalsRow?.totalItems ?? 0,
			totalQuantity: totalsRow?.totalQuantity ?? '0',
			distinctProducts: totalsRow?.distinctProducts ?? 0,
			expiringSoonCount: expiringRow?.count ?? 0,
			withoutExpiryCount: withoutExpiryRow?.count ?? 0,
			lowStockCount: lowStockRow?.count ?? 0,
			addedLast7Days: addedRow?.count ?? 0,
			byLocation
		};
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

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function addDaysIso(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}