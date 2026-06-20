/**
 * Query recent app_error rows from prod Cloud SQL (public IP).
 * Usage: node scripts/query-prod-app-errors.mjs [limit]
 */
import postgres from 'postgres';
import { execSync } from 'node:child_process';

const limit = Math.min(100, Math.max(1, Number(process.argv[2] ?? 30)));

const socketUrl = execSync(
	'npx firebase apphosting:secrets:access DATABASE_URL --project home-pantry-4bee5',
	{ encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
).trim();

const match = socketUrl.match(/postgresql:\/\/([^:]+):([^@]+)@/);
if (!match) {
	console.error('Could not parse DATABASE_URL secret');
	process.exit(1);
}

const [, user, password] = match;
const publicUrl = `postgresql://${user}:${encodeURIComponent(password)}@34.158.71.215:5432/pantry`;

const sql = postgres(publicUrl, { connect_timeout: 15, max: 1 });

try {
	const rows = await sql`
		SELECT id, message, path, status_code, user_id, created_at,
			LEFT(stack, 500) AS stack_preview
		FROM app_error
		ORDER BY created_at DESC
		LIMIT ${limit}
	`;
	console.log(JSON.stringify(rows, null, 2));
} catch (error) {
	console.error('Query failed:', error instanceof Error ? error.message : error);
	process.exit(1);
} finally {
	await sql.end();
}
