import { getDatabaseBackend, db } from '$lib/infrastructure/db';
import { isHealthAuthorized } from '$lib/server/health-auth';
import { sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	if (!isHealthAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const backend = getDatabaseBackend();
	try {
		await db.execute(sql`SELECT 1`);

		return json({ ok: true, backend });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return json({ ok: false, backend, message }, { status: 500 });
	}
};