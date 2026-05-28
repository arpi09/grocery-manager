import { and, eq } from 'drizzle-orm';
import type { HouseholdMemberView, HouseholdRole, HouseholdView } from '$lib/domain/household';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { householdMemberTable, householdTable, userTable } from '$lib/infrastructure/db/schema';

export interface IHouseholdRepository {
	findPrimaryHouseholdIdForUser(userId: string): Promise<string | null>;
	getHouseholdForUser(userId: string): Promise<HouseholdView | null>;
	createHousehold(id: string, name: string): Promise<void>;
	addMember(householdId: string, userId: string, role: HouseholdRole): Promise<void>;
	hasMember(householdId: string, userId: string): Promise<boolean>;
}

export class DrizzleHouseholdRepository implements IHouseholdRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async findPrimaryHouseholdIdForUser(userId: string) {
		const [row] = await this.database
			.select({ householdId: householdMemberTable.householdId })
			.from(householdMemberTable)
			.where(eq(householdMemberTable.userId, userId))
			.limit(1);

		return row?.householdId ?? null;
	}

	async getHouseholdForUser(userId: string): Promise<HouseholdView | null> {
		const householdId = await this.findPrimaryHouseholdIdForUser(userId);
		if (!householdId) {
			return null;
		}

		const [household] = await this.database
			.select()
			.from(householdTable)
			.where(eq(householdTable.id, householdId))
			.limit(1);

		if (!household) {
			return null;
		}

		const members = await this.database
			.select({
				userId: householdMemberTable.userId,
				role: householdMemberTable.role,
				email: userTable.email,
				displayName: userTable.displayName
			})
			.from(householdMemberTable)
			.innerJoin(userTable, eq(householdMemberTable.userId, userTable.id))
			.where(eq(householdMemberTable.householdId, householdId));

		return {
			id: household.id,
			name: household.name,
			members: members.map(
				(m): HouseholdMemberView => ({
					userId: m.userId,
					email: m.email,
					displayName: m.displayName,
					role: m.role as HouseholdRole
				})
			)
		};
	}

	async createHousehold(id: string, name: string) {
		await this.database.insert(householdTable).values({ id, name });
	}

	async addMember(householdId: string, userId: string, role: HouseholdRole) {
		await this.database
			.insert(householdMemberTable)
			.values({ householdId, userId, role })
			.onConflictDoNothing();
	}

	async hasMember(householdId: string, userId: string) {
		const [row] = await this.database
			.select({ userId: householdMemberTable.userId })
			.from(householdMemberTable)
			.where(
				and(
					eq(householdMemberTable.householdId, householdId),
					eq(householdMemberTable.userId, userId)
				)
			)
			.limit(1);

		return !!row;
	}
}
