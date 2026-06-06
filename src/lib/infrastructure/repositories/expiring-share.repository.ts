import { eq } from 'drizzle-orm';
import type { ExpiringSharePreview, ExpiringShareSnapshot } from '$lib/domain/expiring-share';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { expiringShareLinkTable } from '$lib/infrastructure/db/schema';

export interface CreateExpiringShareInput {
	id: string;
	householdId: string;
	createdByUserId: string;
	tokenHash: string;
	snapshot: ExpiringShareSnapshot;
	expiresAt: Date;
}

export interface IExpiringShareRepository {
	create(input: CreateExpiringShareInput): Promise<void>;
	findByTokenHash(tokenHash: string): Promise<ExpiringSharePreview | null>;
}

export class DrizzleExpiringShareRepository implements IExpiringShareRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async create(input: CreateExpiringShareInput): Promise<void> {
		await this.database.insert(expiringShareLinkTable).values({
			id: input.id,
			householdId: input.householdId,
			createdByUserId: input.createdByUserId,
			tokenHash: input.tokenHash,
			snapshotJson: JSON.stringify(input.snapshot),
			expiresAt: input.expiresAt,
			createdAt: new Date()
		});
	}

	async findByTokenHash(tokenHash: string): Promise<ExpiringSharePreview | null> {
		const rows = await this.database
			.select({
				snapshotJson: expiringShareLinkTable.snapshotJson,
				expiresAt: expiringShareLinkTable.expiresAt,
				createdAt: expiringShareLinkTable.createdAt
			})
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.tokenHash, tokenHash))
			.limit(1);

		const row = rows[0];
		if (!row) {
			return null;
		}

		if (row.expiresAt.getTime() <= Date.now()) {
			return null;
		}

		let snapshot: ExpiringShareSnapshot;
		try {
			snapshot = JSON.parse(row.snapshotJson) as ExpiringShareSnapshot;
		} catch {
			return null;
		}

		return {
			items: snapshot.items,
			expiresAt: row.expiresAt,
			createdAt: row.createdAt
		};
	}
}
