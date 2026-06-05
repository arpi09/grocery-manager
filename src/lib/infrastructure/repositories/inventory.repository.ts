import { and, eq, gte, lte, sql } from 'drizzle-orm';

import { InventoryAnalyticsRepository } from './inventory-analytics.repository';
import { InventoryCrudRepository } from './inventory-crud.repository';
import {
	activeNotAutoExpiredFilter,
	autoExpiredFilter,
	mapInventoryRow
} from './inventory-repository.shared';

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



export class DrizzleInventoryRepository implements IInventoryRepository {
	private readonly crud: InventoryCrudRepository;
	private readonly analytics: InventoryAnalyticsRepository;

	constructor(private readonly database: AppDatabase = db) {
		this.crud = new InventoryCrudRepository(database);
		this.analytics = new InventoryAnalyticsRepository(database);
	}



	async findById(householdId: string, id: string) {

		const [row] = await this.database

			.select()

			.from(inventoryItemTable)

			.where(

				and(eq(inventoryItemTable.id, id), eq(inventoryItemTable.householdId, householdId))

			)

			.limit(1);



		return row ? mapInventoryRow(row) : null;

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



		return rows.map(mapInventoryRow);

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



		return rows.map(mapInventoryRow);

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



		return rows.map(mapInventoryRow);

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



		return rows.map(mapInventoryRow);

	}



	async findAllByHousehold(householdId: string, context: InventoryListContext) {

		const rows = await this.database

			.select()

			.from(inventoryItemTable)

			.where(

				and(eq(inventoryItemTable.householdId, householdId), activeNotAutoExpiredFilter(context))

			)

			.orderBy(inventoryItemTable.name);



		return rows.map(mapInventoryRow);

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



		return rows.map(mapInventoryRow);

	}



	async countByLocation(householdId: string, context: InventoryListContext) {
		return this.analytics.countByLocation(householdId, context);
	}

	async getAnalytics(householdId: string, context: InventoryListContext) {
		return this.analytics.getAnalytics(householdId, context);
	}

	async weeklyAddedCounts(householdId: string, weekCount: number, referenceDate?: Date) {
		return this.analytics.weeklyAddedCounts(householdId, weekCount, referenceDate);
	}

	async create(householdId: string, userId: string, id: string, input: CreateInventoryItemInput) {
		return this.crud.create(householdId, userId, id, input);
	}

	async update(householdId: string, id: string, input: UpdateInventoryItemInput) {
		return this.crud.update(householdId, id, input);
	}

	async delete(householdId: string, id: string) {
		return this.crud.delete(householdId, id);
	}
}

