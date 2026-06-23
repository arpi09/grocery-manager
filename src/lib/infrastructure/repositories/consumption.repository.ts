import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { WeeklyCount } from '$lib/domain/statistik';
import { startOfWeek } from '$lib/domain/statistik';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { consumptionEventTable } from '$lib/infrastructure/db/schema';

export type ConsumptionEventType = 'consumed' | 'discarded' | 'expired';

export interface RecordConsumptionInput {
	id: string;
	householdId: string;
	userId: string;
	item: InventoryItem;
	eventType?: ConsumptionEventType;
	consumedQuantity?: string;
	consumedUnit?: string | null;
	notes?: string | null;
}

export interface IConsumptionRepository {
	record(input: RecordConsumptionInput): Promise<void>;
	countByEventTypes(
		householdId: string,
		eventTypes: ConsumptionEventType[]
	): Promise<number>;
	countByEventTypeSince(
		householdId: string,
		eventTypes: ConsumptionEventType[],
		since: Date
	): Promise<number>;
	weeklyCountsByEventType(
		householdId: string,
		eventTypes: ConsumptionEventType[],
		weekCount: number,
		referenceDate?: Date
	): Promise<WeeklyCount[]>;
	listEventsForSavings(householdId: string): Promise<
		Array<{ productName: string; eventType: ConsumptionEventType }>
	>;
	listEventsForSavingsInPeriod(
		householdId: string,
		since: Date,
		until: Date
	): Promise<Array<{ productName: string; eventType: ConsumptionEventType }>>;
	hasConsumptionBefore(householdId: string, before: Date): Promise<boolean>;
	listWasteEventsBetween(
		start: Date,
		end: Date
	): Promise<Array<{ productName: string; createdAt: Date; householdId: string }>>;
	listRecentConsumedProductNames(householdId: string, since: Date, limit?: number): Promise<string[]>;
}

export class DrizzleConsumptionRepository implements IConsumptionRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async record(input: RecordConsumptionInput): Promise<void> {
		const {
			id,
			householdId,
			userId,
			item,
			eventType = 'consumed',
			consumedQuantity,
			consumedUnit,
			notes = null
		} = input;
		await this.database.insert(consumptionEventTable).values({
			id,
			householdId,
			userId,
			inventoryItemId: item.id,
			productName: item.name,
			eventType,
			quantity: consumedQuantity ?? item.quantity,
			unit: consumedUnit ?? item.unit,
			location: item.location,
			notes,
			createdAt: new Date()
		});
	}

	async countByEventTypes(
		householdId: string,
		eventTypes: ConsumptionEventType[]
	): Promise<number> {
		if (eventTypes.length === 0) return 0;

		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(consumptionEventTable)
			.where(
				and(
					eq(consumptionEventTable.householdId, householdId),
					inArray(consumptionEventTable.eventType, eventTypes)
				)
			);

		return row?.count ?? 0;
	}

	async countByEventTypeSince(
		householdId: string,
		eventTypes: ConsumptionEventType[],
		since: Date
	): Promise<number> {
		if (eventTypes.length === 0) return 0;

		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(consumptionEventTable)
			.where(
				and(
					eq(consumptionEventTable.householdId, householdId),
					inArray(consumptionEventTable.eventType, eventTypes),
					gte(consumptionEventTable.createdAt, since)
				)
			);

		return row?.count ?? 0;
	}

	async weeklyCountsByEventType(
		householdId: string,
		eventTypes: ConsumptionEventType[],
		weekCount: number,
		referenceDate: Date = new Date()
	): Promise<WeeklyCount[]> {
		if (eventTypes.length === 0) return [];

		const earliestWeek = startOfWeek(referenceDate);
		earliestWeek.setUTCDate(earliestWeek.getUTCDate() - (weekCount - 1) * 7);

		const rows = await this.database
			.select({
				weekStart: sql<string>`to_char(date_trunc('week', ${consumptionEventTable.createdAt}), 'YYYY-MM-DD')`,
				count: sql<number>`count(*)::int`
			})
			.from(consumptionEventTable)
			.where(
				and(
					eq(consumptionEventTable.householdId, householdId),
					inArray(consumptionEventTable.eventType, eventTypes),
					gte(consumptionEventTable.createdAt, earliestWeek)
				)
			)
			.groupBy(sql`date_trunc('week', ${consumptionEventTable.createdAt})`)
			.orderBy(sql`date_trunc('week', ${consumptionEventTable.createdAt})`);

		return rows.map((row) => ({ weekStart: row.weekStart, count: row.count }));
	}

	async listEventsForSavings(householdId: string) {
		const rows = await this.database
			.select({
				productName: consumptionEventTable.productName,
				eventType: consumptionEventTable.eventType
			})
			.from(consumptionEventTable)
			.where(eq(consumptionEventTable.householdId, householdId));

		return rows.map((row) => ({
			productName: row.productName,
			eventType: row.eventType as ConsumptionEventType
		}));
	}

	async listEventsForSavingsInPeriod(householdId: string, since: Date, until: Date) {
		const rows = await this.database
			.select({
				productName: consumptionEventTable.productName,
				eventType: consumptionEventTable.eventType
			})
			.from(consumptionEventTable)
			.where(
				and(
					eq(consumptionEventTable.householdId, householdId),
					gte(consumptionEventTable.createdAt, since),
					lt(consumptionEventTable.createdAt, until)
				)
			);

		return rows.map((row) => ({
			productName: row.productName,
			eventType: row.eventType as ConsumptionEventType
		}));
	}

	async hasConsumptionBefore(householdId: string, before: Date): Promise<boolean> {
		const [row] = await this.database
			.select({ count: sql<number>`count(*)::int` })
			.from(consumptionEventTable)
			.where(
				and(
					eq(consumptionEventTable.householdId, householdId),
					lt(consumptionEventTable.createdAt, before)
				)
			);

		return (row?.count ?? 0) > 0;
	}

	async listWasteEventsBetween(start: Date, end: Date) {
		const rows = await this.database
			.select({
				productName: consumptionEventTable.productName,
				createdAt: consumptionEventTable.createdAt,
				householdId: consumptionEventTable.householdId
			})
			.from(consumptionEventTable)
			.where(
				and(
					inArray(consumptionEventTable.eventType, ['discarded', 'expired']),
					gte(consumptionEventTable.createdAt, start),
					lt(consumptionEventTable.createdAt, end)
				)
			);

		return rows;
	}

	async listRecentConsumedProductNames(
		householdId: string,
		since: Date,
		limit = 10
	): Promise<string[]> {
		const rows = await this.database
			.select({
				productName: consumptionEventTable.productName,
				createdAt: consumptionEventTable.createdAt
			})
			.from(consumptionEventTable)
			.where(
				and(
					eq(consumptionEventTable.householdId, householdId),
					eq(consumptionEventTable.eventType, 'consumed'),
					gte(consumptionEventTable.createdAt, since)
				)
			)
			.orderBy(desc(consumptionEventTable.createdAt))
			.limit(limit * 3);

		const seen = new Set<string>();
		const names: string[] = [];
		for (const row of rows) {
			const name = row.productName.trim();
			if (!name) continue;
			const key = name.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			names.push(name);
			if (names.length >= limit) break;
		}
		return names;
	}
}
