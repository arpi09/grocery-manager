/**
 * One-off prod cleanup: delete user by email (Cloud SQL via DATABASE_URL in .env).
 * Usage: node --env-file=.env scripts/delete-prod-user-by-email.mjs <email>
 */
import postgres from 'postgres';

const email = process.argv[2]?.trim();
if (!email) {
	console.error('Usage: node --env-file=.env scripts/delete-prod-user-by-email.mjs <email>');
	process.exit(1);
}
if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

try {
	const before = await sql`
		SELECT id, email, created_at FROM "user" WHERE email = ${email}
	`;
	console.log('BEFORE:', JSON.stringify(before, null, 2));
	if (before.length === 0) {
		console.log('No user found — nothing to delete.');
		process.exit(0);
	}

	await sql.begin(async (tx) => {
		const deleted = await tx`DELETE FROM "user" WHERE email = ${email} RETURNING id`;
		console.log('DELETED:', JSON.stringify(deleted, null, 2));
	});

	const after = await sql`SELECT id FROM "user" WHERE email = ${email}`;
	console.log('AFTER count:', after.length);
} finally {
	await sql.end();
}
