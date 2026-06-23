import { json } from '@sveltejs/kit';
import { db } from '$lib/infrastructure/db';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { inventoryService } from '$lib/server/di';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/** Nightly backfill: infer BBF for active items missing expiresOn. */
export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const rows = await db
		.selectDistinct({ householdId: inventoryItemTable.householdId })
		.from(inventoryItemTable)
		.where(sql`${inventoryItemTable.expiresOn} is null and ${inventoryItemTable.quantity}::numeric > 0`);

	let updated = 0;
	for (const row of rows) {
		updated += await inventoryService.backfillMissingExpiryDates(row.householdId, 40);
	}

	return json({ ok: true, updated, households: rows.length });
};
