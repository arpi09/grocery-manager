import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';
import { ensureDefaultAdminUser } from './seed-admin';

export type AppDatabase =
	| PostgresJsDatabase<typeof schema>
	| PgliteDatabase<typeof schema>;

let dbInstance: AppDatabase | null = null;
let initPromise: Promise<void> | null = null;

let pgliteClient: PGlite | null = null;
let pgliteInitPromise: Promise<PGlite> | null = null;

const PGlite_DATA_DIR = join(process.cwd(), 'data', 'pantry');

function usePglite(): boolean {
	return env.USE_PGLITE === 'true' || env.USE_PGLITE === '1';
}

/** Full schema — only on a new PGlite data directory. */
const PGlite_BASELINE_MIGRATION = '0000_init.sql';
/** Safe to re-run on every startup (uses IF NOT EXISTS). */
const PGlite_INCREMENTAL_MIGRATIONS = ['0001_user_role.sql'];

async function runPgliteBaseline(client: PGlite) {
	const migrationPath = join(process.cwd(), 'drizzle', PGlite_BASELINE_MIGRATION);
	const sql = readFileSync(migrationPath, 'utf8');
	await client.exec(sql);
}

async function runPgliteIncrementalMigrations(client: PGlite) {
	for (const file of PGlite_INCREMENTAL_MIGRATIONS) {
		const migrationPath = join(process.cwd(), 'drizzle', file);
		const sql = readFileSync(migrationPath, 'utf8');
		await client.exec(sql);
	}
}

async function openPglite(): Promise<PGlite> {
	mkdirSync(join(process.cwd(), 'data'), { recursive: true });
	const client = new PGlite(PGlite_DATA_DIR);
	await runPgliteBaseline(client);
	await runPgliteIncrementalMigrations(client);
	return client;
}

async function getPgliteClient(): Promise<PGlite> {
	if (pgliteClient) {
		return pgliteClient;
	}

	if (!pgliteInitPromise) {
		pgliteInitPromise = openPglite()
			.then((client) => {
				pgliteClient = client;
				return client;
			})
			.catch(async (error) => {
				pgliteInitPromise = null;
				pgliteClient = null;
				rmSync(PGlite_DATA_DIR, { recursive: true, force: true });
				const client = await openPglite();
				pgliteClient = client;
				return client;
			});
	}

	return pgliteInitPromise;
}

export async function initDatabase(): Promise<void> {
	if (dbInstance) {
		return;
	}

	if (!initPromise) {
		initPromise = (async () => {
			if (usePglite()) {
				const client = await getPgliteClient();
				await runPgliteIncrementalMigrations(client);
				dbInstance = drizzlePglite({ client, schema });
				await ensureDefaultAdminUser();
				return;
			}

			const connectionString = env.DATABASE_URL;
			if (!connectionString) {
				throw new Error(
					'DATABASE_URL is required unless USE_PGLITE=true (local dev without Docker)'
				);
			}

			const sql = postgres(connectionString);
			dbInstance = drizzlePostgres(sql, { schema });

			await ensureDefaultAdminUser();
		})().catch((error) => {
			initPromise = null;
			throw error;
		});
	}

	await initPromise;
}

export function getDb(): AppDatabase {
	if (!dbInstance) {
		throw new Error('Database not initialized. initDatabase() must run first.');
	}
	return dbInstance;
}
