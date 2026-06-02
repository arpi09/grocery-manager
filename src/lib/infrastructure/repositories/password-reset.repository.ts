import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { passwordResetTokenTable } from '$lib/infrastructure/db/schema';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export interface PasswordResetTokenRow {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
	usedAt: Date | null;
}

export interface IPasswordResetRepository {
	createToken(userId: string, id: string, tokenHash: string): Promise<void>;
	findValidByTokenHash(tokenHash: string): Promise<PasswordResetTokenRow | null>;
	markUsed(id: string): Promise<void>;
	invalidateAllForUser(userId: string): Promise<void>;
	countRecentForUser(userId: string, since: Date): Promise<number>;
	countRecentForIp(ipKey: string, since: Date): Promise<number>;
}

export class DrizzlePasswordResetRepository implements IPasswordResetRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async createToken(userId: string, id: string, tokenHash: string) {
		const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
		await this.db.insert(passwordResetTokenTable).values({
			id,
			userId,
			tokenHash,
			expiresAt
		});
	}

	async findValidByTokenHash(tokenHash: string) {
		const now = new Date();
		const [row] = await this.db
			.select({
				id: passwordResetTokenTable.id,
				userId: passwordResetTokenTable.userId,
				tokenHash: passwordResetTokenTable.tokenHash,
				expiresAt: passwordResetTokenTable.expiresAt,
				usedAt: passwordResetTokenTable.usedAt
			})
			.from(passwordResetTokenTable)
			.where(
				and(
					eq(passwordResetTokenTable.tokenHash, tokenHash),
					isNull(passwordResetTokenTable.usedAt),
					gt(passwordResetTokenTable.expiresAt, now)
				)
			)
			.limit(1);

		return row ?? null;
	}

	async markUsed(id: string) {
		await this.db
			.update(passwordResetTokenTable)
			.set({ usedAt: new Date() })
			.where(eq(passwordResetTokenTable.id, id));
	}

	async invalidateAllForUser(userId: string) {
		await this.db
			.update(passwordResetTokenTable)
			.set({ usedAt: new Date() })
			.where(
				and(
					eq(passwordResetTokenTable.userId, userId),
					isNull(passwordResetTokenTable.usedAt)
				)
			);
	}

	async countRecentForUser(userId: string, since: Date) {
		const [row] = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(passwordResetTokenTable)
			.where(
				and(
					eq(passwordResetTokenTable.userId, userId),
					gt(passwordResetTokenTable.createdAt, since)
				)
			);
		return Number(row?.count ?? 0);
	}

	async countRecentForIp(_ipKey: string, _since: Date) {
		// IP tracking is handled in-memory via auth-rate-limit; DB column omitted for privacy.
		return 0;
	}
}
