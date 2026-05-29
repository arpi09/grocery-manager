import { eq, isNull, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { generateId } from '$lib/infrastructure/auth/id';
import { hashPassword } from '$lib/infrastructure/auth/password';
import { getDb } from '$lib/infrastructure/db/init';
import {
	householdMemberTable,
	householdTable,
	inventoryItemTable,
	userTable
} from '$lib/infrastructure/db/schema';

const DEFAULT_MEMBER_EMAIL = 'amanda.derborn@hotmail.com';
export const DEFAULT_HOUSEHOLD_ID = 'household-hemmet';
const DEFAULT_HOUSEHOLD_NAME = 'Hemmet';

function adminEmail(): string {
	const fallback = 'arvid.pilhall@me.com';
	return (env.ADMIN_EMAIL ?? fallback).trim().toLowerCase();
}

function memberEmail(): string {
	const fromEnv =
		env.DEFAULT_MEMBER_EMAIL?.trim() || env.AMANDA_EMAIL?.trim() || DEFAULT_MEMBER_EMAIL;
	return fromEnv.toLowerCase();
}

function memberPassword(): string | null {
	const password = env.DEFAULT_MEMBER_PASSWORD?.trim() || env.AMANDA_PASSWORD?.trim();
	return password || null;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
	const db = getDb();
	const [row] = await db
		.select({ id: userTable.id })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);
	return row?.id ?? null;
}

async function ensureMemberUser(): Promise<string | null> {
	const email = memberEmail();
	const password = memberPassword();
	const db = getDb();

	const existingId = await findUserIdByEmail(email);
	if (existingId) {
		if (password) {
			await db
				.update(userTable)
				.set({ passwordHash: await hashPassword(password) })
				.where(eq(userTable.id, existingId));
		}
		return existingId;
	}

	if (!password) {
		console.warn(
			`[seed-household] No user for ${email}. Set DEFAULT_MEMBER_PASSWORD (or AMANDA_PASSWORD) in .env to create the default member account.`
		);
		return null;
	}

	const id = generateId();
	await db.insert(userTable).values({
		id,
		email,
		passwordHash: await hashPassword(password),
		role: 'user',
		petsEnabled: false
	});
	return id;
}

async function ensureDefaultHouseholdRow() {
	const db = getDb();
	const [existing] = await db
		.select({ id: householdTable.id })
		.from(householdTable)
		.where(eq(householdTable.id, DEFAULT_HOUSEHOLD_ID))
		.limit(1);

	if (!existing) {
		await db.insert(householdTable).values({
			id: DEFAULT_HOUSEHOLD_ID,
			name: DEFAULT_HOUSEHOLD_NAME
		});
	}
}

async function ensureMemberInHousehold(userId: string, role: 'owner' | 'editor') {
	const db = getDb();
	await db
		.insert(householdMemberTable)
		.values({
			householdId: DEFAULT_HOUSEHOLD_ID,
			userId,
			role
		})
		.onConflictDoNothing();
}

async function backfillInventoryHouseholdIds() {
	const db = getDb();
	await db.execute(sql`
		UPDATE inventory_items AS i
		SET household_id = hm.household_id
		FROM household_member AS hm
		WHERE hm.user_id = i.user_id
			AND i.household_id IS NULL
	`);

	await db
		.update(inventoryItemTable)
		.set({ householdId: DEFAULT_HOUSEHOLD_ID })
		.where(isNull(inventoryItemTable.householdId));
}

export async function ensureDefaultHousehold(): Promise<void> {
	const db = getDb();
	await ensureDefaultHouseholdRow();

	const adminId = await findUserIdByEmail(adminEmail());
	const memberId = await ensureMemberUser();

	if (adminId) {
		await ensureMemberInHousehold(adminId, 'owner');
	}
	if (memberId) {
		await ensureMemberInHousehold(memberId, 'editor');
	}

	await backfillInventoryHouseholdIds();
}
