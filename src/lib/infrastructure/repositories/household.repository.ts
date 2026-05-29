import { and, asc, eq } from 'drizzle-orm';
import type {
	HouseholdInviteView,
	HouseholdMemberView,
	HouseholdRole,
	HouseholdView,
	InviteRole,
	InviteStatus,
	UserHouseholdSummary
} from '$lib/domain/household';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import {
	householdInviteTable,
	householdMemberTable,
	householdTable,
	userTable
} from '$lib/infrastructure/db/schema';

export interface HouseholdInviteRow {
	id: string;
	householdId: string;
	email: string;
	role: InviteRole;
	token: string;
	invitedByUserId: string;
	status: InviteStatus;
	expiresAt: Date;
	createdAt: Date;
}

export interface InvitePreviewRow {
	householdName: string;
	email: string;
	role: InviteRole;
	status: InviteStatus;
	expiresAt: Date;
}

export interface IHouseholdRepository {
	findPrimaryHouseholdIdForUser(userId: string): Promise<string | null>;
	getActiveHouseholdIdForUser(userId: string): Promise<string | null>;
	setActiveHouseholdId(userId: string, householdId: string | null): Promise<void>;
	listHouseholdsForUser(userId: string): Promise<UserHouseholdSummary[]>;
	getHouseholdById(householdId: string): Promise<HouseholdView | null>;
	getHouseholdForUser(userId: string): Promise<HouseholdView | null>;
	createHousehold(id: string, name: string): Promise<void>;
	addMember(householdId: string, userId: string, role: HouseholdRole): Promise<void>;
	hasMember(householdId: string, userId: string): Promise<boolean>;
	getMemberRole(householdId: string, userId: string): Promise<HouseholdRole | null>;
	countOwners(householdId: string): Promise<number>;
	findUserIdByEmail(email: string): Promise<string | null>;
	isMemberByEmail(householdId: string, email: string): Promise<boolean>;
	createInvite(row: {
		id: string;
		householdId: string;
		email: string;
		role: InviteRole;
		token: string;
		invitedByUserId: string;
		expiresAt: Date;
	}): Promise<HouseholdInviteRow>;
	findInviteByToken(token: string): Promise<HouseholdInviteRow | null>;
	findPendingInviteByEmail(householdId: string, email: string): Promise<HouseholdInviteRow | null>;
	listPendingInvites(householdId: string): Promise<HouseholdInviteView[]>;
	acceptInvite(inviteId: string, userId: string, role: HouseholdRole): Promise<void>;
	revokePendingInvite(householdId: string, inviteId: string): Promise<boolean>;
	updateMemberRole(
		householdId: string,
		userId: string,
		role: HouseholdRole
	): Promise<boolean>;
	removeMember(householdId: string, userId: string): Promise<boolean>;
	getInvitePreview(token: string): Promise<InvitePreviewRow | null>;
}

export class DrizzleHouseholdRepository implements IHouseholdRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async findPrimaryHouseholdIdForUser(userId: string) {
		const [row] = await this.database
			.select({ householdId: householdMemberTable.householdId })
			.from(householdMemberTable)
			.innerJoin(householdTable, eq(householdMemberTable.householdId, householdTable.id))
			.where(eq(householdMemberTable.userId, userId))
			.orderBy(asc(householdTable.name))
			.limit(1);

		return row?.householdId ?? null;
	}

	async getActiveHouseholdIdForUser(userId: string) {
		const [row] = await this.database
			.select({ activeHouseholdId: userTable.activeHouseholdId })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		return row?.activeHouseholdId ?? null;
	}

	async setActiveHouseholdId(userId: string, householdId: string | null) {
		await this.database
			.update(userTable)
			.set({ activeHouseholdId: householdId })
			.where(eq(userTable.id, userId));
	}

	async listHouseholdsForUser(userId: string): Promise<UserHouseholdSummary[]> {
		const activeId = await this.getActiveHouseholdIdForUser(userId);

		const rows = await this.database
			.select({
				id: householdTable.id,
				name: householdTable.name,
				role: householdMemberTable.role
			})
			.from(householdMemberTable)
			.innerJoin(householdTable, eq(householdMemberTable.householdId, householdTable.id))
			.where(eq(householdMemberTable.userId, userId))
			.orderBy(asc(householdTable.name));

		return rows.map(
			(row): UserHouseholdSummary => ({
				id: row.id,
				name: row.name,
				role: row.role as HouseholdRole,
				isActive: row.id === activeId
			})
		);
	}

	async getHouseholdById(householdId: string): Promise<HouseholdView | null> {
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

	async getHouseholdForUser(userId: string): Promise<HouseholdView | null> {
		const activeId = await this.getActiveHouseholdIdForUser(userId);
		if (activeId && (await this.hasMember(activeId, userId))) {
			return this.getHouseholdById(activeId);
		}

		const householdId = await this.findPrimaryHouseholdIdForUser(userId);
		if (!householdId) {
			return null;
		}

		return this.getHouseholdById(householdId);
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

	async getMemberRole(householdId: string, userId: string): Promise<HouseholdRole | null> {
		const [row] = await this.database
			.select({ role: householdMemberTable.role })
			.from(householdMemberTable)
			.where(
				and(
					eq(householdMemberTable.householdId, householdId),
					eq(householdMemberTable.userId, userId)
				)
			)
			.limit(1);

		return (row?.role as HouseholdRole | undefined) ?? null;
	}

	async countOwners(householdId: string) {
		const rows = await this.database
			.select({ userId: householdMemberTable.userId })
			.from(householdMemberTable)
			.where(
				and(
					eq(householdMemberTable.householdId, householdId),
					eq(householdMemberTable.role, 'owner')
				)
			);

		return rows.length;
	}

	async findUserIdByEmail(email: string) {
		const [row] = await this.database
			.select({ id: userTable.id })
			.from(userTable)
			.where(eq(userTable.email, email))
			.limit(1);

		return row?.id ?? null;
	}

	async isMemberByEmail(householdId: string, email: string) {
		const userId = await this.findUserIdByEmail(email);
		if (!userId) {
			return false;
		}
		return this.hasMember(householdId, userId);
	}

	async createInvite(row: {
		id: string;
		householdId: string;
		email: string;
		role: InviteRole;
		token: string;
		invitedByUserId: string;
		expiresAt: Date;
	}) {
		const [created] = await this.database
			.insert(householdInviteTable)
			.values({
				id: row.id,
				householdId: row.householdId,
				email: row.email,
				role: row.role,
				token: row.token,
				invitedByUserId: row.invitedByUserId,
				status: 'pending',
				expiresAt: row.expiresAt
			})
			.returning();

		return mapInviteRow(created);
	}

	async findInviteByToken(token: string) {
		const [row] = await this.database
			.select()
			.from(householdInviteTable)
			.where(eq(householdInviteTable.token, token))
			.limit(1);

		return row ? mapInviteRow(row) : null;
	}

	async findPendingInviteByEmail(householdId: string, email: string) {
		const [row] = await this.database
			.select()
			.from(householdInviteTable)
			.where(
				and(
					eq(householdInviteTable.householdId, householdId),
					eq(householdInviteTable.email, email),
					eq(householdInviteTable.status, 'pending')
				)
			)
			.limit(1);

		return row ? mapInviteRow(row) : null;
	}

	async listPendingInvites(householdId: string): Promise<HouseholdInviteView[]> {
		const rows = await this.database
			.select({
				id: householdInviteTable.id,
				email: householdInviteTable.email,
				role: householdInviteTable.role,
				status: householdInviteTable.status,
				expiresAt: householdInviteTable.expiresAt,
				createdAt: householdInviteTable.createdAt,
				invitedByEmail: userTable.email
			})
			.from(householdInviteTable)
			.innerJoin(userTable, eq(householdInviteTable.invitedByUserId, userTable.id))
			.where(
				and(
					eq(householdInviteTable.householdId, householdId),
					eq(householdInviteTable.status, 'pending')
				)
			);

		return rows.map(
			(row): HouseholdInviteView => ({
				id: row.id,
				email: row.email,
				role: row.role as InviteRole,
				status: row.status as InviteStatus,
				expiresAt: row.expiresAt,
				createdAt: row.createdAt,
				invitedByEmail: row.invitedByEmail
			})
		);
	}

	async acceptInvite(inviteId: string, userId: string, role: HouseholdRole) {
		const invite = await this.findInviteById(inviteId);
		if (!invite) {
			return;
		}

		await this.database.transaction(async (tx) => {
			await tx
				.update(householdInviteTable)
				.set({ status: 'accepted' })
				.where(eq(householdInviteTable.id, inviteId));

			await tx
				.insert(householdMemberTable)
				.values({
					householdId: invite.householdId,
					userId,
					role
				})
				.onConflictDoNothing();
		});
	}

	async revokePendingInvite(householdId: string, inviteId: string) {
		const [existing] = await this.database
			.select({ id: householdInviteTable.id })
			.from(householdInviteTable)
			.where(
				and(
					eq(householdInviteTable.id, inviteId),
					eq(householdInviteTable.householdId, householdId),
					eq(householdInviteTable.status, 'pending')
				)
			)
			.limit(1);

		if (!existing) {
			return false;
		}

		await this.database
			.update(householdInviteTable)
			.set({ status: 'revoked' })
			.where(eq(householdInviteTable.id, inviteId));

		return true;
	}

	async updateMemberRole(householdId: string, userId: string, role: HouseholdRole) {
		const [existing] = await this.database
			.select({ userId: householdMemberTable.userId })
			.from(householdMemberTable)
			.where(
				and(
					eq(householdMemberTable.householdId, householdId),
					eq(householdMemberTable.userId, userId)
				)
			)
			.limit(1);

		if (!existing) {
			return false;
		}

		await this.database
			.update(householdMemberTable)
			.set({ role })
			.where(
				and(
					eq(householdMemberTable.householdId, householdId),
					eq(householdMemberTable.userId, userId)
				)
			);

		return true;
	}

	async removeMember(householdId: string, userId: string) {
		const [existing] = await this.database
			.select({ userId: householdMemberTable.userId })
			.from(householdMemberTable)
			.where(
				and(
					eq(householdMemberTable.householdId, householdId),
					eq(householdMemberTable.userId, userId)
				)
			)
			.limit(1);

		if (!existing) {
			return false;
		}

		await this.database
			.delete(householdMemberTable)
			.where(
				and(
					eq(householdMemberTable.householdId, householdId),
					eq(householdMemberTable.userId, userId)
				)
			);

		return true;
	}

	async getInvitePreview(token: string): Promise<InvitePreviewRow | null> {
		const [row] = await this.database
			.select({
				householdName: householdTable.name,
				email: householdInviteTable.email,
				role: householdInviteTable.role,
				status: householdInviteTable.status,
				expiresAt: householdInviteTable.expiresAt
			})
			.from(householdInviteTable)
			.innerJoin(householdTable, eq(householdInviteTable.householdId, householdTable.id))
			.where(eq(householdInviteTable.token, token))
			.limit(1);

		if (!row) {
			return null;
		}

		return {
			householdName: row.householdName,
			email: row.email,
			role: row.role as InviteRole,
			status: row.status as InviteStatus,
			expiresAt: row.expiresAt
		};
	}

	private async findInviteById(id: string) {
		const [row] = await this.database
			.select()
			.from(householdInviteTable)
			.where(eq(householdInviteTable.id, id))
			.limit(1);

		return row ? mapInviteRow(row) : null;
	}
}

function mapInviteRow(row: typeof householdInviteTable.$inferSelect): HouseholdInviteRow {
	return {
		id: row.id,
		householdId: row.householdId,
		email: row.email,
		role: row.role as InviteRole,
		token: row.token,
		invitedByUserId: row.invitedByUserId,
		status: row.status as InviteStatus,
		expiresAt: row.expiresAt,
		createdAt: row.createdAt
	};
}
