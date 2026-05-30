import { and, eq, sql } from 'drizzle-orm';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { householdMemberTable, inventoryItemTable } from '$lib/infrastructure/db/schema';

export interface NonAiPlanUsage {
	maxInventoryItems: number;
	maxHouseholdMembers: number;
}

export interface IPlanLimitsRepository {
	getNonAiUsage(householdId: string | null): Promise<NonAiPlanUsage>;
}

function activeQuantityFilter() {
	return sql`${inventoryItemTable.quantity} > 0`;
}

export class DrizzlePlanLimitsRepository implements IPlanLimitsRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async getNonAiUsage(householdId: string | null): Promise<NonAiPlanUsage> {
		if (!householdId) {
			return { maxInventoryItems: 0, maxHouseholdMembers: 0 };
		}

		const [inventoryRow, membersRow] = await Promise.all([
			this.database
				.select({ count: sql<number>`count(*)::int` })
				.from(inventoryItemTable)
				.where(
					and(eq(inventoryItemTable.householdId, householdId), activeQuantityFilter())
				),
			this.database
				.select({ count: sql<number>`count(*)::int` })
				.from(householdMemberTable)
				.where(eq(householdMemberTable.householdId, householdId))
		]);

		return {
			maxInventoryItems: inventoryRow[0]?.count ?? 0,
			maxHouseholdMembers: membersRow[0]?.count ?? 0
		};
	}
}
