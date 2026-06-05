import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { EXPIRING_SOON_DAYS } from '$lib/domain/inventory-analytics';
import type { StorageLocation } from '$lib/domain/location';
import type { LocationCount } from '$lib/domain/inventory-item';
import { startOfWeek } from '$lib/domain/statistik';
import type { WeeklyCount } from '$lib/domain/statistik';
import type { AppDatabase } from '$lib/infrastructure/db';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';
import type { InventoryAnalyticsSnapshot, InventoryListContext } from './inventory.repository';
import {
	activeNotAutoExpiredFilter,
	addDays,
	addDaysIso
} from './inventory-repository.shared';

export class InventoryAnalyticsRepository {
	constructor(private readonly database: AppDatabase) {}

	async countByLocation(
		householdId: string,
		context: InventoryListContext
	): Promise<LocationCount[]> {
		const rows = await this.database
			.select({
				location: inventoryItemTable.location,
				count: sql<number>`count(*)::int`
			})
			.from(inventoryItemTable)
			.where(and(eq(inventoryItemTable.householdId, householdId), activeNotAutoExpiredFilter(context)))
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
				and(eq(inventoryItemTable.householdId, householdId), gte(inventoryItemTable.createdAt, earliestWeek))
			)
			.groupBy(sql`date_trunc('week', ${inventoryItemTable.createdAt})`)
			.orderBy(sql`date_trunc('week', ${inventoryItemTable.createdAt})`);

		return rows.map((row) => ({ weekStart: row.weekStart, count: row.count }));
	}
}
