import { json } from '@sveltejs/kit';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { canAutoFinishExpiredItem } from '$lib/domain/auto-expired';
import { householdMemberTable, householdTable, inventoryItemTable, userTable } from '$lib/infrastructure/db/schema';
import { mapInventoryRow } from '$lib/infrastructure/repositories/inventory-repository.shared';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { isAutoFinishEnabled } from '$lib/server/feature-flags';
import type { RequestHandler } from './$types';

/** Optional auto-finish: zero quantity after grace + user-configured days in expired section. */
export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	if (!isAutoFinishEnabled()) {
		return json({ ok: true, skipped: true, reason: 'AUTO_FINISH_ENABLED not true' });
	}

	const optedIn = await db
		.select({ id: userTable.id, extraDays: userTable.autoFinishExpiredDays })
		.from(userTable)
		.where(eq(userTable.autoFinishExpiredEnabled, true));

	let finished = 0;
	const today = new Date();

	for (const user of optedIn) {
		const memberships = await db
			.select({
				householdId: householdMemberTable.householdId,
				graceDays: householdTable.autoExpiredGraceDays
			})
			.from(householdMemberTable)
			.innerJoin(householdTable, eq(householdMemberTable.householdId, householdTable.id))
			.where(eq(householdMemberTable.userId, user.id));

		for (const membership of memberships) {
			const candidates = await db
				.select()
				.from(inventoryItemTable)
				.where(
					and(
						eq(inventoryItemTable.householdId, membership.householdId),
						isNotNull(inventoryItemTable.expiresOn),
						sql`${inventoryItemTable.quantity}::numeric > 0`
					)
				);

			for (const row of candidates) {
				const item = mapInventoryRow(row);
				if (
					!canAutoFinishExpiredItem(item, membership.graceDays, user.extraDays, today)
				) {
					continue;
				}

				const updated = await db
					.update(inventoryItemTable)
					.set({ quantity: '0', updatedAt: new Date() })
					.where(eq(inventoryItemTable.id, item.id))
					.returning();

				if (updated.length > 0) {
					finished += 1;
				}
			}
		}
	}

	return json({ ok: true, finished, users: optedIn.length });
};
