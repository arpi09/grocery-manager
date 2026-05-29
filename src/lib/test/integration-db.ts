import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '$lib/infrastructure/db/schema';
import { DEFAULT_HOUSEHOLD_ID } from '$lib/infrastructure/db/seed-household';

export interface IntegrationDbContext {
	client: PGlite;
	db: ReturnType<typeof drizzle<typeof schema>>;
	reset(): Promise<void>;
	seedUser(user: { id: string; email?: string }): Promise<void>;
	seedHousehold(household: {
		id?: string;
		name?: string;
		members: Array<{ userId: string; role: 'owner' | 'editor' | 'viewer' | 'member' }>;
	}): Promise<string>;
	close(): Promise<void>;
}

const SQL_MIGRATION_FILES = [
	'0000_init.sql',
	'0001_user_role.sql',
	'0002_user_last_seen.sql',
	'0003_household.sql',
	'0004_user_profile.sql',
	'0005_app_error.sql',
	'0006_user_theme_preference.sql',
	'0007_household_invites_roles.sql',
	'0008_shopping_list.sql',
	'0011_consumption_event.sql'
];
const SQL_TRUNCATE_ALL = `
TRUNCATE TABLE
	"session",
	"consumption_event",
	"shopping_list_item",
	"inventory_items",
	"meal_plans",
	"recipe_ideas",
	"pet_food_items",
	"pets",
	"household_invite",
	"household_member",
	"household",
	"app_error",
	"user"
RESTART IDENTITY CASCADE;
`;

export async function createIntegrationDb(): Promise<IntegrationDbContext> {
	const client = new PGlite();
	for (const file of SQL_MIGRATION_FILES) {
		const migrationSql = readFileSync(join(process.cwd(), 'drizzle', file), 'utf8');
		await client.exec(migrationSql);
	}

	const db = drizzle({ client, schema });

	return {
		client,
		db,
		async reset() {
			await client.exec(SQL_TRUNCATE_ALL);
		},
		async seedUser(user) {
			const now = new Date();
			await db.insert(schema.userTable).values({
				id: user.id,
				email: user.email ?? `${user.id}@example.com`,
				passwordHash: 'integration-test-password-hash',
				role: 'user',
				createdAt: now
			});
		},
		async seedHousehold(household) {
			const id = household.id ?? DEFAULT_HOUSEHOLD_ID;
			const now = new Date();
			await db.insert(schema.householdTable).values({
				id,
				name: household.name ?? 'Test household',
				createdAt: now
			});
			if (household.members.length > 0) {
				await db.insert(schema.householdMemberTable).values(
					household.members.map((m) => ({
						householdId: id,
						userId: m.userId,
						role: m.role === 'member' ? 'editor' : m.role
					}))
				);
			}
			return id;
		},
		async close() {
			await client.close();
		}
	};
}
