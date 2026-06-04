import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { emailVerificationTokenTable } from '$lib/infrastructure/db/schema';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export interface EmailVerificationTokenRow {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
	usedAt: Date | null;
}

export interface IEmailVerificationRepository {
	createToken(userId: string, id: string, tokenHash: string): Promise<void>;
	findValidByTokenHash(tokenHash: string): Promise<EmailVerificationTokenRow | null>;
	markUsed(id: string): Promise<void>;
	invalidateAllForUser(userId: string): Promise<void>;
	countRecentForUser(userId: string, since: Date): Promise<number>;
}

export class DrizzleEmailVerificationRepository implements IEmailVerificationRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async createToken(userId: string, id: string, tokenHash: string) {
		const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
		await this.db.insert(emailVerificationTokenTable).values({
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
				id: emailVerificationTokenTable.id,
				userId: emailVerificationTokenTable.userId,
				tokenHash: emailVerificationTokenTable.tokenHash,
				expiresAt: emailVerificationTokenTable.expiresAt,
				usedAt: emailVerificationTokenTable.usedAt
			})
			.from(emailVerificationTokenTable)
			.where(
				and(
					eq(emailVerificationTokenTable.tokenHash, tokenHash),
					isNull(emailVerificationTokenTable.usedAt),
					gt(emailVerificationTokenTable.expiresAt, now)
				)
			)
			.limit(1);

		return row ?? null;
	}

	async markUsed(id: string) {
		await this.db
			.update(emailVerificationTokenTable)
			.set({ usedAt: new Date() })
			.where(eq(emailVerificationTokenTable.id, id));
	}

	async invalidateAllForUser(userId: string) {
		await this.db
			.update(emailVerificationTokenTable)
			.set({ usedAt: new Date() })
			.where(
				and(
					eq(emailVerificationTokenTable.userId, userId),
					isNull(emailVerificationTokenTable.usedAt)
				)
			);
	}

	async countRecentForUser(userId: string, since: Date) {
		const [row] = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(emailVerificationTokenTable)
			.where(
				and(
					eq(emailVerificationTokenTable.userId, userId),
					gt(emailVerificationTokenTable.createdAt, since)
				)
			);
		return Number(row?.count ?? 0);
	}
}
