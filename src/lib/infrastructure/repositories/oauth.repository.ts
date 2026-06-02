import { and, eq } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { oauthAccountTable } from '$lib/infrastructure/db/schema';

export const GOOGLE_PROVIDER_ID = 'google';

export interface IOAuthRepository {
	findByProviderUserId(
		providerId: string,
		providerUserId: string
	): Promise<{ userId: string } | null>;
	findByUserId(providerId: string, userId: string): Promise<{ providerUserId: string } | null>;
	linkAccount(providerId: string, providerUserId: string, userId: string): Promise<void>;
}

export class DrizzleOAuthRepository implements IOAuthRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async findByProviderUserId(providerId: string, providerUserId: string) {
		const [row] = await this.db
			.select({ userId: oauthAccountTable.userId })
			.from(oauthAccountTable)
			.where(
				and(
					eq(oauthAccountTable.providerId, providerId),
					eq(oauthAccountTable.providerUserId, providerUserId)
				)
			)
			.limit(1);

		return row ?? null;
	}

	async findByUserId(providerId: string, userId: string) {
		const [row] = await this.db
			.select({ providerUserId: oauthAccountTable.providerUserId })
			.from(oauthAccountTable)
			.where(
				and(eq(oauthAccountTable.providerId, providerId), eq(oauthAccountTable.userId, userId))
			)
			.limit(1);

		return row ?? null;
	}

	async linkAccount(providerId: string, providerUserId: string, userId: string) {
		await this.db.insert(oauthAccountTable).values({
			providerId,
			providerUserId,
			userId
		});
	}
}
