import { count, desc, eq, gt, gte, sql } from 'drizzle-orm';
import { latestLastSeenAt } from '$lib/domain/admin-stats';
import { ERROR_LOG_RETENTION_MS } from '$lib/domain/error-log';
import type { AppErrorEntry, AppErrorSummary } from '$lib/domain/error-log';
import { isUserActiveNow } from '$lib/domain/presence';
import type { UserRole } from '$lib/domain/user';
import { db, getDatabaseBackend, type DatabaseBackend } from '$lib/infrastructure/db';
import {
	appErrorTable,
	householdMemberTable,
	householdTable,
	inventoryItemTable,
	sessionTable,
	userTable
} from '$lib/infrastructure/db/schema';
import type { IErrorLogRepository } from '$lib/infrastructure/repositories/error-log.repository';

export interface AdminUserSummary {
	id: string;
	email: string;
	role: UserRole;
	petsEnabled: boolean;
	signupUtmSource: string | null;
	createdAt: Date;
	lastSeenAt: Date | null;
	isActiveNow: boolean;
	hasActiveSession: boolean;
	inventoryCount: number;
}

export interface AdminDashboardStats {
	userCount: number;
	householdCount: number;
	membershipCount: number;
	inventoryCount: number;
	shoppingListItemCount: number | null;
	errorCount7Days: number;
	errorCountTotal: number;
	activeNowCount: number;
	activeSessionCount: number;
	lastActivityAt: Date | null;
	databaseBackend: DatabaseBackend;
}

export interface IAdminRepository {
	getDashboardStats(): Promise<AdminDashboardStats>;
	listUsers(limit: number, offset: number): Promise<{ users: AdminUserSummary[]; total: number }>;
	listRecentErrors(limit: number): Promise<AppErrorEntry[]>;
	listRecentErrorSummaries(limit: number): Promise<AppErrorSummary[]>;
	getErrorStack(id: string): Promise<string | null>;
	setUserRole(userId: string, role: UserRole): Promise<void>;
	setUserPetsEnabled(userId: string, enabled: boolean): Promise<void>;
	invalidateAllSessions(): Promise<number>;
	invalidateUserSessions(userId: string): Promise<number>;
}

function readExecuteCount(result: unknown): number {
	const rows = Array.isArray(result)
		? result
		: typeof result === 'object' && result !== null && 'rows' in result
			? (result as { rows: unknown[] }).rows
			: [];
	const row = rows[0] as { count?: number | string } | undefined;
	return Number(row?.count ?? 0);
}

export class DrizzleAdminRepository implements IAdminRepository {
	constructor(private readonly errorLog: IErrorLogRepository) {}
	private async getActiveSessionUserIds(): Promise<Set<string>> {
		const now = new Date();
		const rows = await db
			.select({ userId: sessionTable.userId })
			.from(sessionTable)
			.where(gt(sessionTable.expiresAt, now));
		return new Set(rows.map((row) => row.userId));
	}

	private async countShoppingListItems(): Promise<number | null> {
		try {
			const result = await db.execute(
				sql`SELECT COUNT(*)::int AS count FROM shopping_list_item`
			);
			return readExecuteCount(result);
		} catch {
			return null;
		}
	}

	async getDashboardStats(): Promise<AdminDashboardStats> {
		const errorCutoff = new Date(Date.now() - ERROR_LOG_RETENTION_MS);
		const [
			[users],
			[households],
			[memberships],
			[inventory],
			[errors7Days],
			[errorsTotal],
			userRows,
			activeSessionUserIds,
			shoppingListItemCount
		] = await Promise.all([
			db.select({ count: count() }).from(userTable),
			db.select({ count: count() }).from(householdTable),
			db.select({ count: count() }).from(householdMemberTable),
			db.select({ count: count() }).from(inventoryItemTable),
			db
				.select({ count: count() })
				.from(appErrorTable)
				.where(gte(appErrorTable.createdAt, errorCutoff)),
			db.select({ count: count() }).from(appErrorTable),
			db.select({ lastSeenAt: userTable.lastSeenAt }).from(userTable),
			this.getActiveSessionUserIds(),
			this.countShoppingListItems()
		]);

		const activeNowCount = userRows.filter((row) => isUserActiveNow(row.lastSeenAt)).length;

		return {
			userCount: users?.count ?? 0,
			householdCount: households?.count ?? 0,
			membershipCount: memberships?.count ?? 0,
			inventoryCount: inventory?.count ?? 0,
			shoppingListItemCount,
			errorCount7Days: errors7Days?.count ?? 0,
			errorCountTotal: errorsTotal?.count ?? 0,
			activeNowCount,
			activeSessionCount: activeSessionUserIds.size,
			lastActivityAt: latestLastSeenAt(userRows),
			databaseBackend: getDatabaseBackend()
		};
	}

	listRecentErrors(limit: number): Promise<AppErrorEntry[]> {
		return this.errorLog.listRecent(limit);
	}

	listRecentErrorSummaries(limit: number): Promise<AppErrorSummary[]> {
		return this.errorLog.listRecentSummaries(limit);
	}

	getErrorStack(id: string): Promise<string | null> {
		return this.errorLog.getStack(id);
	}

	async listUsers(limit: number, offset: number): Promise<{ users: AdminUserSummary[]; total: number }> {
		const [users, inventoryCounts, activeSessionUserIds, [totalRow]] = await Promise.all([
			db
				.select({
					id: userTable.id,
					email: userTable.email,
					role: userTable.role,
					petsEnabled: userTable.petsEnabled,
					signupUtmSource: userTable.signupUtmSource,
					createdAt: userTable.createdAt,
					lastSeenAt: userTable.lastSeenAt
				})
				.from(userTable)
				.orderBy(desc(userTable.createdAt))
				.limit(limit)
				.offset(offset),
			db
				.select({
					userId: inventoryItemTable.userId,
					count: count()
				})
				.from(inventoryItemTable)
				.groupBy(inventoryItemTable.userId),
			this.getActiveSessionUserIds(),
			db.select({ count: count() }).from(userTable)
		]);

		const countByUser = new Map(
			inventoryCounts.map((row) => [row.userId, Number(row.count)])
		);

		return {
			total: totalRow?.count ?? 0,
			users: users.map((user) => ({
				id: user.id,
				email: user.email,
				role: user.role as UserRole,
				petsEnabled: user.petsEnabled,
				signupUtmSource: user.signupUtmSource,
				createdAt: user.createdAt,
				lastSeenAt: user.lastSeenAt,
				isActiveNow: isUserActiveNow(user.lastSeenAt),
				hasActiveSession: activeSessionUserIds.has(user.id),
				inventoryCount: countByUser.get(user.id) ?? 0
			}))
		};
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
