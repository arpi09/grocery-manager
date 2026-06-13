import { and, desc, eq, gte } from 'drizzle-orm';
import type { StorageLocation } from '$lib/domain/location';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { householdLocationRuleTable } from '$lib/infrastructure/db/schema';

export interface HouseholdLocationRule {
	householdId: string;
	normalizedKey: string;
	location: StorageLocation;
	sampleCount: number;
	updatedAt: Date;
}

export interface UpsertHouseholdLocationRuleInput {
	householdId: string;
	normalizedKey: string;
	location: StorageLocation;
	sampleCount: number;
}

export interface IHouseholdLocationRuleRepository {
	findByKey(householdId: string, normalizedKey: string): Promise<HouseholdLocationRule | null>;
	listByHousehold(householdId: string, minSampleCount?: number): Promise<HouseholdLocationRule[]>;
	delete(householdId: string, normalizedKey: string): Promise<boolean>;
	upsert(input: UpsertHouseholdLocationRuleInput): Promise<HouseholdLocationRule>;
}

function mapRule(row: typeof householdLocationRuleTable.$inferSelect): HouseholdLocationRule {
	return {
		householdId: row.householdId,
		normalizedKey: row.normalizedKey,
		location: row.location as StorageLocation,
		sampleCount: row.sampleCount,
		updatedAt: row.updatedAt
	};
}

export class DrizzleHouseholdLocationRuleRepository implements IHouseholdLocationRuleRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async findByKey(
		householdId: string,
		normalizedKey: string
	): Promise<HouseholdLocationRule | null> {
		const [row] = await this.database
			.select()
			.from(householdLocationRuleTable)
			.where(
				and(
					eq(householdLocationRuleTable.householdId, householdId),
					eq(householdLocationRuleTable.normalizedKey, normalizedKey)
				)
			)
			.limit(1);

		return row ? mapRule(row) : null;
	}

	async listByHousehold(
		householdId: string,
		minSampleCount = 1
	): Promise<HouseholdLocationRule[]> {
		const rows = await this.database
			.select()
			.from(householdLocationRuleTable)
			.where(
				and(
					eq(householdLocationRuleTable.householdId, householdId),
					gte(householdLocationRuleTable.sampleCount, minSampleCount)
				)
			)
			.orderBy(desc(householdLocationRuleTable.updatedAt));

		return rows.map(mapRule);
	}

	async delete(householdId: string, normalizedKey: string): Promise<boolean> {
		const deleted = await this.database
			.delete(householdLocationRuleTable)
			.where(
				and(
					eq(householdLocationRuleTable.householdId, householdId),
					eq(householdLocationRuleTable.normalizedKey, normalizedKey)
				)
			)
			.returning();

		return deleted.length > 0;
	}

	async upsert(input: UpsertHouseholdLocationRuleInput): Promise<HouseholdLocationRule> {
		const updatedAt = new Date();
		const [row] = await this.database
			.insert(householdLocationRuleTable)
			.values({
				householdId: input.householdId,
				normalizedKey: input.normalizedKey,
				location: input.location,
				sampleCount: input.sampleCount,
				updatedAt
			})
			.onConflictDoUpdate({
				target: [householdLocationRuleTable.householdId, householdLocationRuleTable.normalizedKey],
				set: {
					location: input.location,
					sampleCount: input.sampleCount,
					updatedAt
				}
			})
			.returning();

		return mapRule(row);
	}
}
