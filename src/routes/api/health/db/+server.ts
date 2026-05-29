import { getDatabaseBackend } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const backend = getDatabaseBackend();
	try {
		const [row] = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				passwordHash: userTable.passwordHash
			})
			.from(userTable)
			.where(eq(userTable.email, 'health-check-nonexistent@example.com'))
			.limit(1);

		return json({ ok: true, backend, userFound: Boolean(row) });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return json({ ok: false, backend, message }, { status: 500 });
	}
};
