import { PGlite } from '@electric-sql/pglite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/pglite';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';

mkdirSync(join(process.cwd(), 'data'), { recursive: true });
const client = new PGlite(join(process.cwd(), 'data', 'pantry'));

// Minimal schema for test
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull()
});

const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

const db = drizzle(client);
const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);
const lucia = new Lucia(adapter, {
	getUserAttributes: (attributes) => ({ email: attributes.email })
});

const sessionId = 'fqr6vuxgb3fx57lgcwgxlybuhfxp3bjzyr7wlbjk';
const result = await lucia.validateSession(sessionId);
console.log('validateSession:', {
	session: result.session?.id ?? null,
	user: result.user?.email ?? null
});
