import { eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';

const LAST_SEEN_THROTTLE_MS = 60_000;
const lastSeenUpdates = new Map<string, number>();

export async function recordUserActivity(userId: string): Promise<void> {
	const now = Date.now();
	const previous = lastSeenUpdates.get(userId) ?? 0;
	if (now - previous < LAST_SEEN_THROTTLE_MS) {
		return;
	}

	lastSeenUpdates.set(userId, now);
	await db.update(userTable).set({ lastSeenAt: new Date() }).where(eq(userTable.id, userId));
}
