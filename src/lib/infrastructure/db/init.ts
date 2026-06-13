import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
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
let cloudSqlConnector: Connector | null = null;

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

/** App Hosting may not mount /cloudsql sockets; prefer connector, then public IP. */
async function createPostgresClient(connectionString: string) {
	const cloudSqlHost = extractCloudSqlSocketHost(connectionString);
	if (cloudSqlHost) {
		const instanceConnectionName = cloudSqlHost.replace(/^\/cloudsql\//, '');
		const { username, password, database } = parseCloudSqlDatabaseUrl(connectionString);
		const publicHost = env.CLOUD_SQL_PUBLIC_HOST?.trim() || '34.158.71.215';

		try {
			cloudSqlConnector ??= new Connector();
			const clientOpts = await cloudSqlConnector.getOptions({
				instanceConnectionName,
				ipType: IpAddressTypes.PUBLIC
			});
			const sql = postgres({
				...clientOpts,
				database,
				username,
				password,
				connect_timeout: 15,
				max: 5
			});
			await verifyPostgresConnection(sql, 2);
			return sql;
		} catch (connectorError) {
			const message =
				connectorError instanceof Error ? connectorError.message : String(connectorError);
			console.error(
				`[initDatabase] Cloud SQL connector failed (${message}); falling back to public IP ${publicHost}`
			);
			return postgres({
				host: publicHost,
				port: 5432,
				database,
				username,
				password,
				ssl: 'require',
				connect_timeout: 15,
				max: 5
			});
		}
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
			const retryable = /ENOENT|ECONNREFUSED|ETIMEDOUT|timeout|connect/i.test(message);
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

/** Full schema — only on a new PGlite data directory. */
const PGlite_BASELINE_MIGRATION = '0000_init.sql';
/**
 * Safe to re-run on every startup (uses IF NOT EXISTS).
 * Drizzle journal has no `0009_*` tag (sequence jumps 0008 → 0010_active_household).
 */
const INCREMENTAL_MIGRATIONS = [
	'0001_user_role.sql',
	'0002_user_last_seen.sql',
	'0003_household.sql',
	'0004_user_profile.sql',
	'0005_app_error.sql',
	'0006_user_theme_preference.sql',
	'0007_household_invites_roles.sql',
	'0008_shopping_list.sql',
	'0010_active_household.sql',
	'0011_consumption_event.sql',
	'0012_product_event.sql',
	'0013_expiry_reminders.sql',
	'0014_product_feedback.sql',
	'0015_ai_usage.sql',
	'0016_waitlist_email.sql',
	'0017_push_subscriptions.sql',
	'0018_user_signup_utm.sql',
	'0019_app_settings.sql',
	'0020_product_event_anonymous.sql',
	'0021_shopping_push.sql',
	'0022_user_is_demo.sql',
	'0023_auth_password_reset_oauth.sql',
	'0024_auto_expired_grace.sql',
	'0025_receipt_purchase_pattern.sql',
	'0026_household_stripe.sql',
	'0027_email_verification.sql',
	'0028_backfill_email_verified_at.sql',
	'0029_pmf_survey_response.sql',
	'0030_expiring_share_link.sql',
	'0031_household_receipt_forward_token.sql',
	'0032_analytics_behavior.sql',
	'0033_shopping_to_pantry_mode.sql',
	'0034_inventory_last_confirmed_at.sql',
	'0035_staleness_reminders.sql',
	'0036_social_post.sql',
	'0037_guide_article.sql',
	'0038_nearby_expiring_share.sql',
	'0039_expiring_share_report_block.sql',
	'0040_nearby_push.sql',
	'0041_receipt_import_funnel_events.sql',
	'0042_acquisition_wedge_events.sql',
	'0043_shopping_list_share_link.sql',
	'0044_receipt_price_memory.sql',
	'0045_inventory_intelligence_events.sql',
	'0046_household_os_events.sql',
	'0047_learning_engine_v1.sql',
	'0048_household_location_rule.sql',
	'0049_household_favorite_product.sql',
	'0050_duo_wedge_events.sql'
];

async function runPgliteBaseline(client: PGlite) {
	const migrationPath = join(process.cwd(), 'drizzle', PGlite_BASELINE_MIGRATION);
	const sql = readFileSync(migrationPath, 'utf8');
	try {
		await client.exec(sql);
	} catch (migrationError) {
		if (!isIgnorableMigrationError(migrationError)) {
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

function isIgnorableMigrationError(error: unknown): boolean {
	const message = migrationErrorMessage(error);
	return /already exists|duplicate key|duplicate_object|duplicate column|multiple primary keys/i.test(
		message
	);
}

async function runIncrementalMigrationFiles(
	runStatement: (statement: string) => Promise<void>
): Promise<void> {
	for (const file of INCREMENTAL_MIGRATIONS) {
		const migrationPath = join(process.cwd(), 'drizzle', file);
		const sql = readFileSync(migrationPath, 'utf8');

		// Run whole file when it uses PL/pgSQL blocks (splitting on ";" breaks them).
		if (/\bDO\s+\$\$/i.test(sql)) {
			try {
				await runStatement(sql);
			} catch (error) {
				if (!isIgnorableMigrationError(error)) {
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
				await runStatement(`${statement};`);
			} catch (error) {
				if (!isIgnorableMigrationError(error)) {
					throw error;
				}
			}
		}
	}
}

async function runPgliteIncrementalMigrations(client: PGlite) {
	await runIncrementalMigrationFiles(async (statement) => {
		await client.exec(statement);
	});
}

async function runPostgresIncrementalMigrations(client: ReturnType<typeof postgres>) {
	await runIncrementalMigrationFiles(async (statement) => {
		await client.unsafe(statement);
	});
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
				const sql = await createPostgresClient(connectionString);
				postgresClient = sql;
				await verifyPostgresConnection(sql);
				await runPostgresIncrementalMigrations(sql);
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

