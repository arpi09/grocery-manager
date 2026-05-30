import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { generateId } from '$lib/infrastructure/auth/id';
import { hashPassword } from '$lib/infrastructure/auth/password';
import { getDb } from '$lib/infrastructure/db/init';
import { userTable } from '$lib/infrastructure/db/schema';

const DEFAULT_ADMIN_EMAIL = 'arvid.pilhall@me.com';

function adminEmail(): string {
	const raw = env.ADMIN_EMAIL?.trim();
	return (raw ? raw : DEFAULT_ADMIN_EMAIL).toLowerCase();
}

function adminPassword(): string | null {
	const password = env.ADMIN_PASSWORD?.trim();
	return password || null;
}

export async function ensureDefaultAdminUser(): Promise<void> {
	const email = adminEmail();
	const password = adminPassword();
	const db = getDb();

	const [existing] = await db
		.select({
			id: userTable.id,
			role: userTable.role
		})
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);

	if (!existing) {
		if (!password) {
			console.warn(
				`[seed-admin] No admin user for ${email}. Set ADMIN_PASSWORD in .env to create the default admin account.`
			);
			return;
		}

		const passwordHash = await hashPassword(password);
		await db.insert(userTable).values({
			id: generateId(),
			email,
			passwordHash,
			role: 'admin',
			petsEnabled: true
		});
		return;
	}

	const updates: Partial<typeof userTable.$inferInsert> = {};

	if (existing.role !== 'admin') {
		updates.role = 'admin';
	}

	if (password) {
		updates.passwordHash = await hashPassword(password);
	}

	if (Object.keys(updates).length > 0) {
		await db.update(userTable).set(updates).where(eq(userTable.id, existing.id));
	}
}

