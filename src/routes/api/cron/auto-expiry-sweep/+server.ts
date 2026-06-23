import { json } from '@sveltejs/kit';
import { and, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { householdMemberTable, householdTable, inventoryItemTable, userTable } from '$lib/infrastructure/db/schema';
import { subtractDaysIso } from '$lib/domain/auto-expired';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { isAutoFinishEnabled } from '$lib/server/brain-feature-flags';
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
	const today = new Date().toISOString().slice(0, 10);

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
			const totalGrace = membership.graceDays + user.extraDays;
			const finishBefore = subtractDaysIso(today, totalGrace);
			const rows = await db
				.update(inventoryItemTable)
				.set({ quantity: '0', updatedAt: new Date() })
				.where(
					and(
						eq(inventoryItemTable.householdId, membership.householdId),
						isNotNull(inventoryItemTable.expiresOn),
						lt(inventoryItemTable.expiresOn, finishBefore),
						sql`${inventoryItemTable.quantity}::numeric > 0`
					)
				)
				.returning();
			finished += rows.length;
		}
	}

	return json({ ok: true, finished, users: optedIn.length });
};
