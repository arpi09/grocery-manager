import { PGlite } from '@electric-sql/pglite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dbPath = join(process.cwd(), 'data', 'pantry');
mkdirSync(join(process.cwd(), 'data'), { recursive: true });
const client = new PGlite(dbPath);

const tables = await client.query(
	`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
);
console.log('Tables:', tables.rows.map((r) => r.tablename));

const users = await client.query(`SELECT id, email FROM "user"`);
console.log('Users:', users.rows);

const sessions = await client.query(`SELECT id, user_id FROM session`);
console.log('Sessions:', sessions.rows);
