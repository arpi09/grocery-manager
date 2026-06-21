import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import {
	marketChatMessageTable,
	marketChatThreadTable,
	marketExchangeRatingTable,
	userTable
} from '$lib/infrastructure/db/schema';

export interface MarketChatThreadRow {
	id: string;
	shareId: string;
	seekerUserId: string;
	sharerUserId: string;
	householdId: string;
	createdAt: Date;
	closedAt: Date | null;
}

export interface MarketChatMessageRow {
	id: string;
	threadId: string;
	authorUserId: string;
	body: string;
	createdAt: Date;
}

export interface MarketExchangeRatingRow {
	id: string;
	threadId: string;
	raterUserId: string;
	ratedUserId: string;
	stars: number;
	createdAt: Date;
}

export interface MarketProfileRow {
	userId: string;
	displayName: string | null;
	marketFirstName: string | null;
	avatarUrl: string | null;
}

export interface IMarketChatRepository {
	createOrGetThread(input: {
		id: string;
		shareId: string;
		seekerUserId: string;
		sharerUserId: string;
		householdId: string;
	}): Promise<{ thread: MarketChatThreadRow; created: boolean }>;
	listThreadsForUser(userId: string): Promise<MarketChatThreadRow[]>;
	findThreadById(threadId: string): Promise<MarketChatThreadRow | null>;
	listMessagesForThread(threadId: string): Promise<MarketChatMessageRow[]>;
	addMessage(input: {
		id: string;
		threadId: string;
		authorUserId: string;
		body: string;
	}): Promise<MarketChatMessageRow>;
	closeThread(threadId: string, closedAt: Date): Promise<boolean>;
	addRating(input: {
		id: string;
		threadId: string;
		raterUserId: string;
		ratedUserId: string;
		stars: number;
	}): Promise<MarketExchangeRatingRow>;
	findRatingForThreadAndRater(
		threadId: string,
		raterUserId: string
	): Promise<MarketExchangeRatingRow | null>;
	getRatingSummary(ratedUserId: string): Promise<{ averageStars: number | null; ratingCount: number }>;
	findMarketProfiles(userIds: string[]): Promise<MarketProfileRow[]>;
}

function mapThread(row: typeof marketChatThreadTable.$inferSelect): MarketChatThreadRow {
	return {
		id: row.id,
		shareId: row.shareId,
		seekerUserId: row.seekerUserId,
		sharerUserId: row.sharerUserId,
		householdId: row.householdId,
		createdAt: row.createdAt,
		closedAt: row.closedAt
	};
}

export class DrizzleMarketChatRepository implements IMarketChatRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async createOrGetThread(input: {
		id: string;
		shareId: string;
		seekerUserId: string;
		sharerUserId: string;
		householdId: string;
	}): Promise<{ thread: MarketChatThreadRow; created: boolean }> {
		const existing = await this.database
			.select()
			.from(marketChatThreadTable)
			.where(
				and(
					eq(marketChatThreadTable.shareId, input.shareId),
					eq(marketChatThreadTable.seekerUserId, input.seekerUserId)
				)
			)
			.limit(1);

		if (existing[0]) {
			return { thread: mapThread(existing[0]), created: false };
		}

		const createdAt = new Date();
		await this.database.insert(marketChatThreadTable).values({
			id: input.id,
			shareId: input.shareId,
			seekerUserId: input.seekerUserId,
			sharerUserId: input.sharerUserId,
			householdId: input.householdId,
			createdAt
		});

		return {
			thread: {
				id: input.id,
				shareId: input.shareId,
				seekerUserId: input.seekerUserId,
				sharerUserId: input.sharerUserId,
				householdId: input.householdId,
				createdAt,
				closedAt: null
			},
			created: true
		};
	}

	async listThreadsForUser(userId: string): Promise<MarketChatThreadRow[]> {
		const rows = await this.database
			.select()
			.from(marketChatThreadTable)
			.where(
				sql`${marketChatThreadTable.seekerUserId} = ${userId} OR ${marketChatThreadTable.sharerUserId} = ${userId}`
			)
			.orderBy(desc(marketChatThreadTable.createdAt));

		return rows.map(mapThread);
	}

	async findThreadById(threadId: string): Promise<MarketChatThreadRow | null> {
		const rows = await this.database
			.select()
			.from(marketChatThreadTable)
			.where(eq(marketChatThreadTable.id, threadId))
			.limit(1);

		return rows[0] ? mapThread(rows[0]) : null;
	}

	async listMessagesForThread(threadId: string): Promise<MarketChatMessageRow[]> {
		return this.database
			.select({
				id: marketChatMessageTable.id,
				threadId: marketChatMessageTable.threadId,
				authorUserId: marketChatMessageTable.authorUserId,
				body: marketChatMessageTable.body,
				createdAt: marketChatMessageTable.createdAt
			})
			.from(marketChatMessageTable)
			.where(eq(marketChatMessageTable.threadId, threadId))
			.orderBy(marketChatMessageTable.createdAt);
	}

	async addMessage(input: {
		id: string;
		threadId: string;
		authorUserId: string;
		body: string;
	}): Promise<MarketChatMessageRow> {
		const createdAt = new Date();
		await this.database.insert(marketChatMessageTable).values({
			id: input.id,
			threadId: input.threadId,
			authorUserId: input.authorUserId,
			body: input.body,
			createdAt
		});

		return {
			id: input.id,
			threadId: input.threadId,
			authorUserId: input.authorUserId,
			body: input.body,
			createdAt
		};
	}

	async closeThread(threadId: string, closedAt: Date): Promise<boolean> {
		const rows = await this.database
			.update(marketChatThreadTable)
			.set({ closedAt })
			.where(and(eq(marketChatThreadTable.id, threadId), sql`${marketChatThreadTable.closedAt} IS NULL`))
			.returning();

		return rows.length > 0;
	}

	async addRating(input: {
		id: string;
		threadId: string;
		raterUserId: string;
		ratedUserId: string;
		stars: number;
	}): Promise<MarketExchangeRatingRow> {
		const createdAt = new Date();
		await this.database.insert(marketExchangeRatingTable).values({
			id: input.id,
			threadId: input.threadId,
			raterUserId: input.raterUserId,
			ratedUserId: input.ratedUserId,
			stars: input.stars,
			createdAt
		});

		return {
			id: input.id,
			threadId: input.threadId,
			raterUserId: input.raterUserId,
			ratedUserId: input.ratedUserId,
			stars: input.stars,
			createdAt
		};
	}

	async findRatingForThreadAndRater(
		threadId: string,
		raterUserId: string
	): Promise<MarketExchangeRatingRow | null> {
		const rows = await this.database
			.select()
			.from(marketExchangeRatingTable)
			.where(
				and(
					eq(marketExchangeRatingTable.threadId, threadId),
					eq(marketExchangeRatingTable.raterUserId, raterUserId)
				)
			)
			.limit(1);

		const row = rows[0];
		if (!row) {
			return null;
		}

		return {
			id: row.id,
			threadId: row.threadId,
			raterUserId: row.raterUserId,
			ratedUserId: row.ratedUserId,
			stars: row.stars,
			createdAt: row.createdAt
		};
	}

	async getRatingSummary(
		ratedUserId: string
	): Promise<{ averageStars: number | null; ratingCount: number }> {
		const rows = await this.database
			.select({
				averageStars: sql<number | null>`avg(${marketExchangeRatingTable.stars})::float`,
				ratingCount: sql<number>`count(*)::int`
			})
			.from(marketExchangeRatingTable)
			.where(eq(marketExchangeRatingTable.ratedUserId, ratedUserId));

		const row = rows[0];
		if (!row || row.ratingCount === 0) {
			return { averageStars: null, ratingCount: 0 };
		}

		return {
			averageStars: row.averageStars,
			ratingCount: row.ratingCount
		};
	}

	async findMarketProfiles(userIds: string[]): Promise<MarketProfileRow[]> {
		if (userIds.length === 0) {
			return [];
		}

		const rows = await this.database
			.select({
				userId: userTable.id,
				displayName: userTable.displayName,
				marketFirstName: userTable.marketFirstName,
				avatarUrl: userTable.avatarUrl
			})
			.from(userTable)
			.where(inArray(userTable.id, userIds));

		return rows;
	}
}
