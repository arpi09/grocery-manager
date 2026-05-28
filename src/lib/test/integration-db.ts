import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '$lib/infrastructure/db/schema';

export interface IntegrationDbContext {
	client: PGlite;
	db: ReturnType<typeof drizzle<typeof schema>>;
	reset(): Promise<void>;
	seedUser(user: { id: string; email?: string }): Promise<void>;
	close(): Promise<void>;
}

const SQL_MIGRATION_FILES = [
	'0000_init.sql',
	'0001_user_role.sql',
	'0002_user_last_seen.sql',
	'0004_user_profile.sql'
];
const SQL_TRUNCATE_ALL = `
TRUNCATE TABLE
	"session",
	"inventory_items",
	"meal_plans",
	"recipe_ideas",
	"pet_food_items",
	"pets",
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
		async close() {
			await client.close();
		}
	};
}
