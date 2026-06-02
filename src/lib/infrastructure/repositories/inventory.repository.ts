import { and, eq, gt, gte, isNull, lte, sql } from 'drizzle-orm';
import { autoExpiredCutoffDate } from '$lib/domain/auto-expired';
import { EXPIRING_SOON_DAYS } from '$lib/domain/inventory-analytics';
import { startOfWeek } from '$lib/domain/statistik';
import type { WeeklyCount } from '$lib/domain/statistik';
import type { StorageLocation } from '$lib/domain/location';
import type {
	CreateInventoryItemInput,
	InventoryItem,
	LocationCount,
	UpdateInventoryItemInput
} from '$lib/domain/inventory-item';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';

export interface InventoryListContext {
	graceDays: number;
}

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
		location: StorageLocation,
		context: InventoryListContext
	): Promise<InventoryItem[]>;
	findByHouseholdAndLocationPaginated(
		householdId: string,
		location: StorageLocation,
		limit: number,
		offset: number,
		context: InventoryListContext
	): Promise<InventoryItem[]>;
	countActiveByLocation(
		householdId: string,
		location: StorageLocation,
		context: InventoryListContext
	): Promise<number>;
	countAutoExpiredByLocation(
		householdId: string,
		location: StorageLocation,
		context: InventoryListContext
	): Promise<number>;
	findAutoExpiredByHouseholdAndLocation(
		householdId: string,
		location: StorageLocation,
		context: InventoryListContext
	): Promise<InventoryItem[]>;
	countFinishedByLocation(householdId: string, location: StorageLocation): Promise<number>;
	findFinishedByHouseholdAndLocation(
		householdId: string,
		location: StorageLocation
	): Promise<InventoryItem[]>;
	findAllByHousehold(householdId: string, context: InventoryListContext): Promise<InventoryItem[]>;
	findExpiringBefore(
		householdId: string,
		beforeDate: string,
		context: InventoryListContext
	): Promise<InventoryItem[]>;
	countByLocation(householdId: string, context: InventoryListContext): Promise<LocationCount[]>;
	getAnalytics(
		householdId: string,
		context: InventoryListContext
	): Promise<InventoryAnalyticsSnapshot>;
	weeklyAddedCounts(
		householdId: string,
		weekCount: number,
		referenceDate?: Date
	): Promise<WeeklyCount[]>;
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

function autoExpiredFilter(context: InventoryListContext) {
	const cutoff = autoExpiredCutoffDate(context.graceDays);
	return and(
		activeQuantityFilter(),
		sql`${inventoryItemTable.expiresOn} is not null`,
		lte(inventoryItemTable.expiresOn, cutoff)
	);
}

function activeNotAutoExpiredFilter(context: InventoryListContext) {
	const cutoff = autoExpiredCutoffDate(context.graceDays);
	return and(
		activeQuantityFilter(),
		sql`(${inventoryItemTable.expiresOn} is null or ${inventoryItemTable.expiresOn} > ${cutoff})`
	);
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
		expiresOnSource: row.expiresOnSource as InventoryItem['expiresOnSource'],
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

	async findByHouseholdAndLocation(
		householdId: string,
		location: StorageLocation,
		context: InventoryListContext
	) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location),
					activeNotAutoExpiredFilter(context)
				)
			)
			.orderBy(inventoryItemTable.name);

		return rows.map(mapRow);
	}

	async findByHouseholdAndLocationPaginated(
		householdId: string,
		location: StorageLocation,
		limit: number,
		offset: number,
		context: InventoryListContext
	) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location),
					activeNotAutoExpiredFilter(context)
				)
			)
			.orderBy(inventoryItemTable.name)
			.limit(limit)
			.offset(offset);

		return rows.map(mapRow);
	}

	async countActiveByLocation(
		householdId: string,
		location: StorageLocation,
		context: InventoryListContext
	) {
		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location),
					activeNotAutoExpiredFilter(context)
				)
			);

		return row?.count ?? 0;
	}

	async countAutoExpiredByLocation(
		householdId: string,
		location: StorageLocation,
		context: InventoryListContext
	) {
		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location),
					autoExpiredFilter(context)
				)
			);

		return row?.count ?? 0;
	}

	async findAutoExpiredByHouseholdAndLocation(
		householdId: string,
		location: StorageLocation,
		context: InventoryListContext
	) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location),
					autoExpiredFilter(context)
				)
			)
			.orderBy(inventoryItemTable.expiresOn, inventoryItemTable.name);

		return rows.map(mapRow);
	}

	async countFinishedByLocation(householdId: string, location: StorageLocation) {
		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					eq(inventoryItemTable.location, location),
					sql`${inventoryItemTable.quantity} <= 0`
				)
			);

		return row?.count ?? 0;
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

	async findAllByHousehold(householdId: string, context: InventoryListContext) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(eq(inventoryItemTable.householdId, householdId), activeNotAutoExpiredFilter(context))
			)
			.orderBy(inventoryItemTable.name);

		return rows.map(mapRow);
	}

	async findExpiringBefore(
		householdId: string,
		beforeDate: string,
		context: InventoryListContext
	) {
		const rows = await this.database
			.select()
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					activeNotAutoExpiredFilter(context),
					sql`${inventoryItemTable.expiresOn} is not null`,
					lte(inventoryItemTable.expiresOn, beforeDate),
					gte(inventoryItemTable.expiresOn, new Date().toISOString().slice(0, 10))
				)
			)
			.orderBy(inventoryItemTable.expiresOn);

		return rows.map(mapRow);
	}

	async countByLocation(householdId: string, context: InventoryListContext) {
		const rows = await this.database
			.select({
				location: inventoryItemTable.location,
				count: sql<number>`count(*)::int`
			})
			.from(inventoryItemTable)
			.where(
				and(eq(inventoryItemTable.householdId, householdId), activeNotAutoExpiredFilter(context))
			)
			.groupBy(inventoryItemTable.location);

		return rows.map((row) => ({
			location: row.location as StorageLocation,
			count: row.count
		}));
	}

	async getAnalytics(
		householdId: string,
		context: InventoryListContext
	): Promise<InventoryAnalyticsSnapshot> {
		const today = new Date().toISOString().slice(0, 10);
		const expiringBefore = addDaysIso(today, EXPIRING_SOON_DAYS);
		const createdSince = addDays(new Date(), -7);
		const householdFilter = and(
			eq(inventoryItemTable.householdId, householdId),
			activeNotAutoExpiredFilter(context)
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

		const byLocation = await this.countByLocation(householdId, context);

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

	async weeklyAddedCounts(
		householdId: string,
		weekCount: number,
		referenceDate: Date = new Date()
	): Promise<WeeklyCount[]> {
		const earliestWeek = startOfWeek(referenceDate);
		earliestWeek.setUTCDate(earliestWeek.getUTCDate() - (weekCount - 1) * 7);

		const rows = await this.database
			.select({
				weekStart: sql<string>`to_char(date_trunc('week', ${inventoryItemTable.createdAt}), 'YYYY-MM-DD')`,
				count: sql<number>`count(*)::int`
			})
			.from(inventoryItemTable)
			.where(
				and(
					eq(inventoryItemTable.householdId, householdId),
					gte(inventoryItemTable.createdAt, earliestWeek)
				)
			)
			.groupBy(sql`date_trunc('week', ${inventoryItemTable.createdAt})`)
			.orderBy(sql`date_trunc('week', ${inventoryItemTable.createdAt})`);

		return rows.map((row) => ({ weekStart: row.weekStart, count: row.count }));
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
				expiresOnSource: input.expiresOnSource ?? null,
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
				...(input.expiresOnSource !== undefined && { expiresOnSource: input.expiresOnSource }),
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
