import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { waitlistEmailTable } from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';
import type { JoinWaitlistInput, WaitlistEntry } from '$lib/domain/waitlist';

export interface IWaitlistRepository {
	join(input: JoinWaitlistInput): Promise<'created' | 'exists'>;
	count(): Promise<number>;
	listRecent(limit: number): Promise<WaitlistEntry[]>;
}

export class DrizzleWaitlistRepository implements IWaitlistRepository {
	async join(input: JoinWaitlistInput): Promise<'created' | 'exists'> {
		const normalizedEmail = input.email.trim().toLowerCase();
		const existing = await db
			.select({ id: waitlistEmailTable.id })
			.from(waitlistEmailTable)
			.where(eq(waitlistEmailTable.email, normalizedEmail))
			.limit(1);

		if (existing.length > 0) {
			return 'exists';
		}

		await db.insert(waitlistEmailTable).values({
			id: generateId(),
			email: normalizedEmail,
			userId: input.userId ?? null,
			source: input.source
		});

		return 'created';
	}

	async count(): Promise<number> {
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(waitlistEmailTable);
		return row?.count ?? 0;
	}

	async listRecent(limit: number): Promise<WaitlistEntry[]> {
		const rows = await db
			.select({
				id: waitlistEmailTable.id,
				email: waitlistEmailTable.email,
				userId: waitlistEmailTable.userId,
				source: waitlistEmailTable.source,
				createdAt: waitlistEmailTable.createdAt
			})
			.from(waitlistEmailTable)
			.orderBy(desc(waitlistEmailTable.createdAt))
			.limit(limit);

		return rows.map((row) => ({
			id: row.id,
			email: row.email,
			userId: row.userId,
			source: row.source as WaitlistEntry['source'],
			createdAt: row.createdAt
		}));
	}
}
