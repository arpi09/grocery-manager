import { count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import {
	inventoryItemTable,
	mealPlanTable,
	petTable,
	userTable
} from '$lib/infrastructure/db/schema';
import type { UserRole } from '$lib/domain/user';

export interface AdminUserSummary {
	id: string;
	email: string;
	role: UserRole;
	petsEnabled: boolean;
	createdAt: Date;
	inventoryCount: number;
}

export interface AdminDashboardStats {
	userCount: number;
	inventoryCount: number;
	mealPlanCount: number;
	petCount: number;
}

export interface IAdminRepository {
	getDashboardStats(): Promise<AdminDashboardStats>;
	listUsers(): Promise<AdminUserSummary[]>;
	setUserRole(userId: string, role: UserRole): Promise<void>;
	setUserPetsEnabled(userId: string, enabled: boolean): Promise<void>;
}

export class DrizzleAdminRepository implements IAdminRepository {
	async getDashboardStats(): Promise<AdminDashboardStats> {
		const [[users], [inventory], [mealPlans], [pets]] = await Promise.all([
			db.select({ count: count() }).from(userTable),
			db.select({ count: count() }).from(inventoryItemTable),
			db.select({ count: count() }).from(mealPlanTable),
			db.select({ count: count() }).from(petTable)
		]);

		return {
			userCount: users?.count ?? 0,
			inventoryCount: inventory?.count ?? 0,
			mealPlanCount: mealPlans?.count ?? 0,
			petCount: pets?.count ?? 0
		};
	}

	async listUsers(): Promise<AdminUserSummary[]> {
		const users = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				role: userTable.role,
				petsEnabled: userTable.petsEnabled,
				createdAt: userTable.createdAt
			})
			.from(userTable)
			.orderBy(desc(userTable.createdAt));

		const inventoryCounts = await db
			.select({
				userId: inventoryItemTable.userId,
				count: count()
			})
			.from(inventoryItemTable)
			.groupBy(inventoryItemTable.userId);

		const countByUser = new Map(
			inventoryCounts.map((row) => [row.userId, Number(row.count)])
		);

		return users.map((user) => ({
			id: user.id,
			email: user.email,
			role: user.role as UserRole,
			petsEnabled: user.petsEnabled,
			createdAt: user.createdAt,
			inventoryCount: countByUser.get(user.id) ?? 0
		}));
	}

	async setUserRole(userId: string, role: UserRole) {
		await db.update(userTable).set({ role }).where(eq(userTable.id, userId));
	}

	async setUserPetsEnabled(userId: string, enabled: boolean) {
		await db.update(userTable).set({ petsEnabled: enabled }).where(eq(userTable.id, userId));
	}
}
