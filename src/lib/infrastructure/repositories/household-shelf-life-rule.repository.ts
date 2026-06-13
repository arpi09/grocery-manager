import { and, desc, eq, gte } from 'drizzle-orm';
import type { StorageLocation } from '$lib/domain/location';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { householdShelfLifeRuleTable } from '$lib/infrastructure/db/schema';

export interface HouseholdShelfLifeRule {
	householdId: string;
	normalizedKey: string;
	location: StorageLocation;
	typicalDays: number;
	sampleCount: number;
	lastPredictedDays: number | null;
	updatedAt: Date;
}

export interface UpsertHouseholdShelfLifeRuleInput {
	householdId: string;
	normalizedKey: string;
	location: StorageLocation;
	typicalDays: number;
	sampleCount: number;
	lastPredictedDays?: number | null;
}

export interface IHouseholdShelfLifeRuleRepository {
	findByKey(
		householdId: string,
		normalizedKey: string,
		location: StorageLocation
	): Promise<HouseholdShelfLifeRule | null>;
	listByHousehold(householdId: string, minSampleCount?: number): Promise<HouseholdShelfLifeRule[]>;
	delete(
		householdId: string,
		normalizedKey: string,
		location: StorageLocation
	): Promise<boolean>;
	upsert(input: UpsertHouseholdShelfLifeRuleInput): Promise<HouseholdShelfLifeRule>;
}

function mapRule(row: typeof householdShelfLifeRuleTable.$inferSelect): HouseholdShelfLifeRule {
	return {
		householdId: row.householdId,
		normalizedKey: row.normalizedKey,
		location: row.location as StorageLocation,
		typicalDays: row.typicalDays,
		sampleCount: row.sampleCount,
		lastPredictedDays: row.lastPredictedDays,
		updatedAt: row.updatedAt
	};
}

export class DrizzleHouseholdShelfLifeRuleRepository implements IHouseholdShelfLifeRuleRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async findByKey(
		householdId: string,
		normalizedKey: string,
		location: StorageLocation
	): Promise<HouseholdShelfLifeRule | null> {
		const [row] = await this.database
			.select()
			.from(householdShelfLifeRuleTable)
			.where(
				and(
					eq(householdShelfLifeRuleTable.householdId, householdId),
					eq(householdShelfLifeRuleTable.normalizedKey, normalizedKey),
					eq(householdShelfLifeRuleTable.location, location)
				)
			)
			.limit(1);

		return row ? mapRule(row) : null;
	}

	async listByHousehold(
		householdId: string,
		minSampleCount = 1
	): Promise<HouseholdShelfLifeRule[]> {
		const rows = await this.database
			.select()
			.from(householdShelfLifeRuleTable)
			.where(
				and(
					eq(householdShelfLifeRuleTable.householdId, householdId),
					gte(householdShelfLifeRuleTable.sampleCount, minSampleCount)
				)
			)
			.orderBy(desc(householdShelfLifeRuleTable.updatedAt));

		return rows.map(mapRule);
	}

	async delete(
		householdId: string,
		normalizedKey: string,
		location: StorageLocation
	): Promise<boolean> {
		const deleted = await this.database
			.delete(householdShelfLifeRuleTable)
			.where(
				and(
					eq(householdShelfLifeRuleTable.householdId, householdId),
					eq(householdShelfLifeRuleTable.normalizedKey, normalizedKey),
					eq(householdShelfLifeRuleTable.location, location)
				)
			)
			.returning();

		return deleted.length > 0;
	}

	async upsert(input: UpsertHouseholdShelfLifeRuleInput): Promise<HouseholdShelfLifeRule> {
		const updatedAt = new Date();
		const [row] = await this.database
			.insert(householdShelfLifeRuleTable)
			.values({
				householdId: input.householdId,
				normalizedKey: input.normalizedKey,
				location: input.location,
				typicalDays: input.typicalDays,
				sampleCount: input.sampleCount,
				lastPredictedDays: input.lastPredictedDays ?? null,
				updatedAt
			})
			.onConflictDoUpdate({
				target: [
					householdShelfLifeRuleTable.householdId,
					householdShelfLifeRuleTable.normalizedKey,
					householdShelfLifeRuleTable.location
				],
				set: {
					typicalDays: input.typicalDays,
					sampleCount: input.sampleCount,
					lastPredictedDays: input.lastPredictedDays ?? null,
					updatedAt
				}
			})
			.returning();

		return mapRule(row);
	}
}
