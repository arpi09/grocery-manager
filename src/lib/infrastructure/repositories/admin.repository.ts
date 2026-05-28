import { count, desc, eq, gt } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import {
	inventoryItemTable,
	mealPlanTable,
	petTable,
	sessionTable,
	userTable
} from '$lib/infrastructure/db/schema';
import { isUserActiveNow } from '$lib/domain/presence';
import type { UserRole } from '$lib/domain/user';

export interface AdminUserSummary {
	id: string;
	email: string;
	role: UserRole;
	petsEnabled: boolean;
	createdAt: Date;
	lastSeenAt: Date | null;
	isActiveNow: boolean;
	hasActiveSession: boolean;
	inventoryCount: number;
}

export interface AdminDashboardStats {
	userCount: number;
	activeNowCount: number;
	activeSessionCount: number;
	inventoryCount: number;
	mealPlanCount: number;
	petCount: number;
}

export interface IAdminRepository {
	getDashboardStats(): Promise<AdminDashboardStats>;
	listUsers(): Promise<AdminUserSummary[]>;
	setUserRole(userId: string, role: UserRole): Promise<void>;
	setUserPetsEnabled(userId: string, enabled: boolean): Promise<void>;
	invalidateAllSessions(): Promise<number>;
	invalidateUserSessions(userId: string): Promise<number>;
}

export class DrizzleAdminRepository implements IAdminRepository {
	private async getActiveSessionUserIds(): Promise<Set<string>> {
		const now = new Date();
		const rows = await db
			.select({ userId: sessionTable.userId })
			.from(sessionTable)
			.where(gt(sessionTable.expiresAt, now));
		return new Set(rows.map((row) => row.userId));
	}

	async getDashboardStats(): Promise<AdminDashboardStats> {
		const [[users], [inventory], [mealPlans], [pets], userRows, activeSessionUserIds] =
			await Promise.all([
				db.select({ count: count() }).from(userTable),
				db.select({ count: count() }).from(inventoryItemTable),
				db.select({ count: count() }).from(mealPlanTable),
				db.select({ count: count() }).from(petTable),
				db.select({ lastSeenAt: userTable.lastSeenAt }).from(userTable),
				this.getActiveSessionUserIds()
			]);

		const activeNowCount = userRows.filter((row) => isUserActiveNow(row.lastSeenAt)).length;

		return {
			userCount: users?.count ?? 0,
			activeNowCount,
			activeSessionCount: activeSessionUserIds.size,
			inventoryCount: inventory?.count ?? 0,
			mealPlanCount: mealPlans?.count ?? 0,
			petCount: pets?.count ?? 0
		};
	}

	async listUsers(): Promise<AdminUserSummary[]> {
		const [users, inventoryCounts, activeSessionUserIds] = await Promise.all([
			db
				.select({
					id: userTable.id,
					email: userTable.email,
					role: userTable.role,
					petsEnabled: userTable.petsEnabled,
					createdAt: userTable.createdAt,
					lastSeenAt: userTable.lastSeenAt
				})
				.from(userTable)
				.orderBy(desc(userTable.createdAt)),
			db
				.select({
					userId: inventoryItemTable.userId,
					count: count()
				})
				.from(inventoryItemTable)
				.groupBy(inventoryItemTable.userId),
			this.getActiveSessionUserIds()
		]);

		const countByUser = new Map(
			inventoryCounts.map((row) => [row.userId, Number(row.count)])
		);

		return users.map((user) => ({
			id: user.id,
			email: user.email,
			role: user.role as UserRole,
			petsEnabled: user.petsEnabled,
			createdAt: user.createdAt,
			lastSeenAt: user.lastSeenAt,
			isActiveNow: isUserActiveNow(user.lastSeenAt),
			hasActiveSession: activeSessionUserIds.has(user.id),
			inventoryCount: countByUser.get(user.id) ?? 0
		}));
	}

	async setUserRole(userId: string, role: UserRole) {
		await db.update(userTable).set({ role }).where(eq(userTable.id, userId));
	}

	async setUserPetsEnabled(userId: string, enabled: boolean) {
		await db.update(userTable).set({ petsEnabled: enabled }).where(eq(userTable.id, userId));
	}

	async invalidateAllSessions() {
		const rows = await db.delete(sessionTable).returning();
		return rows.length;
	}

	async invalidateUserSessions(userId: string) {
		const rows = await db.delete(sessionTable).where(eq(sessionTable.userId, userId)).returning();
		return rows.length;
	}
}
