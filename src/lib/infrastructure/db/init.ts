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
import { ensureDefaultHousehold } from './seed-household';

export type AppDatabase =
	| PostgresJsDatabase<typeof schema>
	| PgliteDatabase<typeof schema>;

let dbInstance: AppDatabase | null = null;
let initPromise: Promise<void> | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;

let pgliteClient: PGlite | null = null;
let pgliteInitPromise: Promise<PGlite> | null = null;

const PGlite_DATA_DIR = join(process.cwd(), 'data', 'pantry');

function usePglite(): boolean {
	return env.USE_PGLITE === 'true' || env.USE_PGLITE === '1';
}
export type DatabaseBackend = 'pglite' | 'postgres';

function extractCloudSqlSocketHost(connectionString: string): string | null {
	const queryStart = connectionString.indexOf('?');
	if (queryStart === -1) {
		return null;
	}
	const host = new URLSearchParams(connectionString.slice(queryStart + 1)).get('host');
	return host?.startsWith('/cloudsql/') ? host : null;
}

function parseCloudSqlDatabaseUrl(connectionString: string): {
	username: string;
	password: string;
	database: string;
} {
	const queryStart = connectionString.indexOf('?');
	const authAndDb = connectionString.slice(connectionString.indexOf('://') + 3, queryStart);
	const at = authAndDb.lastIndexOf('@');
	if (at === -1) {
		throw new Error('Cloud SQL DATABASE_URL must include user credentials before @');
	}
	const userPass = authAndDb.slice(0, at);
	const database = authAndDb.slice(at + 1).replace(/^\//, '');
	const colon = userPass.indexOf(':');
	if (colon === -1) {
		throw new Error('Cloud SQL DATABASE_URL must include user:password');
	}
	return {
		username: decodeURIComponent(userPass.slice(0, colon)),
		password: decodeURIComponent(userPass.slice(colon + 1)),
		database: decodeURIComponent(database)
	};
}

/** postgres.js rejects `postgresql://user:pass@/db?host=/cloudsql/...` ("Invalid URL"). */
function createPostgresClient(connectionString: string) {
	const cloudSqlHost = extractCloudSqlSocketHost(connectionString);
	if (cloudSqlHost) {
		const { username, password, database } = parseCloudSqlDatabaseUrl(connectionString);
		return postgres({
			host: cloudSqlHost,
			database,
			username,
			password,
			ssl: false,
			connect_timeout: 15,
			max: 5
		});
	}
	return postgres(connectionString, {
		connect_timeout: 15,
		max: 5,
		ssl: connectionString.includes('sslmode=disable') ? false : 'require'
	});
}

async function verifyPostgresConnection(
	sql: ReturnType<typeof postgres>,
	attempts = 6
): Promise<void> {
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			await sql`SELECT 1`;
			return;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const retryable = /ENOENT|ECONNREFUSED|connect/i.test(message);
			if (!retryable || attempt === attempts) {
				throw error;
			}
			await new Promise((resolve) => setTimeout(resolve, attempt * 400));
		}
	}
}

async function resetPostgresClient(): Promise<void> {
	if (!postgresClient) {
		return;
	}
	const client = postgresClient;
	postgresClient = null;
	await client.end({ timeout: 0 }).catch(() => {});
}

export function getDatabaseBackend(): DatabaseBackend {
	return usePglite() ? 'pglite' : 'postgres';
}

/** Full schema â€” only on a new PGlite data directory. */
const PGlite_BASELINE_MIGRATION = '0000_init.sql';
/** Safe to re-run on every startup (uses IF NOT EXISTS). */
const PGlite_INCREMENTAL_MIGRATIONS = [
	'0001_user_role.sql',
	'0002_user_last_seen.sql',
	'0003_household.sql',
	'0004_user_profile.sql',
	'0005_app_error.sql',
	'0006_user_theme_preference.sql',
	'0007_household_invites_roles.sql',
	'0008_shopping_list.sql',
	'0010_active_household.sql',
	'0011_consumption_event.sql'
];

async function runPgliteBaseline(client: PGlite) {
	const migrationPath = join(process.cwd(), 'drizzle', PGlite_BASELINE_MIGRATION);
	const sql = readFileSync(migrationPath, 'utf8');
	try {
		await client.exec(sql);
	} catch (migrationError) {
		if (!isIgnorablePgliteMigrationError(migrationError)) {
			throw migrationError;
		}
	}
}

function migrationErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return [error.message, error.cause instanceof Error ? error.cause.message : ''].join(' ');
	}
	return String(error);
}

function isIgnorablePgliteMigrationError(error: unknown): boolean {
	const message = migrationErrorMessage(error);
	return /already exists|duplicate key|duplicate_object|duplicate column|multiple primary keys/i.test(
		message
	);
}

async function runPgliteIncrementalMigrations(client: PGlite) {
	for (const file of PGlite_INCREMENTAL_MIGRATIONS) {
		const migrationPath = join(process.cwd(), 'drizzle', file);
		const sql = readFileSync(migrationPath, 'utf8');

		// Run whole file when it uses PL/pgSQL blocks (splitting on ";" breaks them).
		if (/\bDO\s+\$\$/i.test(sql)) {
			try {
				await client.exec(sql);
			} catch (error) {
				if (!isIgnorablePgliteMigrationError(error)) {
					throw error;
				}
			}
			continue;
		}

		const statements = sql
			.split(';')
			.map((statement) => statement.trim())
			.filter(Boolean);

		for (const statement of statements) {
			try {
				await client.exec(`${statement};`);
			} catch (error) {
				if (!isIgnorablePgliteMigrationError(error)) {
					throw error;
				}
			}
		}
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
			.catch(async () => {
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
				dbInstance = drizzlePglite({ client, schema });
				await ensureDefaultAdminUser();
				await ensureDefaultHousehold();
				return;
			}

			const connectionString = env.DATABASE_URL;
			if (!connectionString) {
				throw new Error(
					'DATABASE_URL is required unless USE_PGLITE=true (local dev without Docker)'
				);
			}

			try {
				const sql = createPostgresClient(connectionString);
				postgresClient = sql;
				await verifyPostgresConnection(sql);
				dbInstance = drizzlePostgres(sql, { schema });

				await ensureDefaultAdminUser();
				await ensureDefaultHousehold();
			} catch (error) {
				dbInstance = null;
				await resetPostgresClient();
				const hint = connectionString.includes('/cloudsql/')
					? ' (Cloud SQL socket — check cloudSqlInstances in apphosting.yaml and Cloud SQL Client IAM)'
					: '';
				const message = error instanceof Error ? error.message : String(error);
				console.error(`[initDatabase] Postgres connection failed${hint}: ${message}`);
				throw error;
			}
		})().catch(async (error) => {
			initPromise = null;
			dbInstance = null;
			await resetPostgresClient();
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

