import { and, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import type { MarketExchangeStatus } from '$lib/domain/market-exchange';
import type {
	MarketChatReportReason,
	MarketItemsAsDescribed,
	MarketLifecycleStatus
} from '$lib/domain/market-lifecycle';
import { MARKET_CHAT_REPLY_REMINDER_MS } from '$lib/domain/market-exchange';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import {
	marketChatMessageTable,
	marketChatReportTable,
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
	exchangeStatus: MarketExchangeStatus;
	lifecycleStatus: MarketLifecycleStatus;
	pickupAgreedAt: Date | null;
	seekerCompletedAt: Date | null;
	sharerCompletedAt: Date | null;
	seekerLastReadAt: Date | null;
	sharerLastReadAt: Date | null;
	replyReminderSentAt: Date | null;
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
	comment: string | null;
	itemsAsDescribed: MarketItemsAsDescribed | null;
	revealedAt: Date | null;
	createdAt: Date;
}

export interface MarketProfileRow {
	userId: string;
	displayName: string | null;
	marketFirstName: string | null;
	avatarUrl: string | null;
}

export interface MarketChatLatestMessageRow {
	threadId: string;
	authorUserId: string;
	body: string;
	createdAt: Date;
}

export interface MarketChatReplyReminderCandidate {
	thread: MarketChatThreadRow;
	recipientUserId: string;
	lastMessage: MarketChatMessageRow;
}

export interface MarketRecentReviewRow {
	id: string;
	stars: number;
	comment: string | null;
	createdAt: Date;
	raterDisplayName: string | null;
	raterMarketFirstName: string | null;
}

export interface MarketChatReportRow {
	id: string;
	threadId: string;
	reporterUserId: string;
	reason: MarketChatReportReason | null;
	dismissedAt: Date | null;
	createdAt: Date;
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
	getLatestMessagesForThreads(threadIds: string[]): Promise<MarketChatLatestMessageRow[]>;
	addMessage(input: {
		id: string;
		threadId: string;
		authorUserId: string;
		body: string;
	}): Promise<MarketChatMessageRow>;
	markExchangeComplete(
		threadId: string,
		input: {
			seekerCompletedAt?: Date;
			sharerCompletedAt?: Date;
			exchangeStatus?: MarketExchangeStatus;
			lifecycleStatus?: MarketLifecycleStatus;
			pickupAgreedAt?: Date;
			closedAt?: Date;
		}
	): Promise<MarketChatThreadRow | null>;
	markThreadRead(threadId: string, role: 'seeker' | 'sharer', readAt: Date): Promise<void>;
	clearReplyReminderSentAt(threadId: string): Promise<void>;
	listThreadsNeedingReplyReminder(now?: Date): Promise<MarketChatReplyReminderCandidate[]>;
	markReplyReminderSent(threadId: string, sentAt: Date): Promise<void>;
	addRating(input: {
		id: string;
		threadId: string;
		raterUserId: string;
		ratedUserId: string;
		stars: number;
		comment?: string | null;
		itemsAsDescribed?: MarketItemsAsDescribed | null;
		revealedAt?: Date | null;
	}): Promise<MarketExchangeRatingRow>;
	findRatingForThreadAndRater(
		threadId: string,
		raterUserId: string
	): Promise<MarketExchangeRatingRow | null>;
	findRatingsForThread(threadId: string): Promise<MarketExchangeRatingRow[]>;
	revealRatingsForThread(threadId: string, revealedAt: Date): Promise<void>;
	listRecentRatingsForUser(userId: string, limit: number): Promise<MarketRecentReviewRow[]>;
	getRatingSummary(ratedUserId: string): Promise<{ averageStars: number | null; ratingCount: number }>;
	findMarketProfiles(userIds: string[]): Promise<MarketProfileRow[]>;
	createReport(input: {
		id: string;
		threadId: string;
		reporterUserId: string;
		reason: MarketChatReportReason | null;
	}): Promise<MarketChatReportRow>;
	listOpenReports(limit: number): Promise<MarketChatReportRow[]>;
	dismissReport(reportId: string, dismissedAt: Date): Promise<boolean>;
}

function mapThread(row: typeof marketChatThreadTable.$inferSelect): MarketChatThreadRow {
	return {
		id: row.id,
		shareId: row.shareId,
		seekerUserId: row.seekerUserId,
		sharerUserId: row.sharerUserId,
		householdId: row.householdId,
		createdAt: row.createdAt,
		closedAt: row.closedAt,
		exchangeStatus: row.exchangeStatus,
		lifecycleStatus: row.lifecycleStatus,
		pickupAgreedAt: row.pickupAgreedAt,
		seekerCompletedAt: row.seekerCompletedAt,
		sharerCompletedAt: row.sharerCompletedAt,
		seekerLastReadAt: row.seekerLastReadAt,
		sharerLastReadAt: row.sharerLastReadAt,
		replyReminderSentAt: row.replyReminderSentAt
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
				closedAt: null,
				exchangeStatus: 'ongoing',
				lifecycleStatus: 'chatting',
				pickupAgreedAt: null,
				seekerCompletedAt: null,
				sharerCompletedAt: null,
				seekerLastReadAt: null,
				sharerLastReadAt: null,
				replyReminderSentAt: null
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

	async getLatestMessagesForThreads(threadIds: string[]): Promise<MarketChatLatestMessageRow[]> {
		if (threadIds.length === 0) {
			return [];
		}

		const rows = await this.database
			.selectDistinctOn([marketChatMessageTable.threadId], {
				threadId: marketChatMessageTable.threadId,
				authorUserId: marketChatMessageTable.authorUserId,
				body: marketChatMessageTable.body,
				createdAt: marketChatMessageTable.createdAt
			})
			.from(marketChatMessageTable)
			.where(inArray(marketChatMessageTable.threadId, threadIds))
			.orderBy(marketChatMessageTable.threadId, desc(marketChatMessageTable.createdAt));

		return rows;
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

		await this.clearReplyReminderSentAt(input.threadId);

		return {
			id: input.id,
			threadId: input.threadId,
			authorUserId: input.authorUserId,
			body: input.body,
			createdAt
		};
	}

	async markExchangeComplete(
		threadId: string,
		input: {
			seekerCompletedAt?: Date;
			sharerCompletedAt?: Date;
			exchangeStatus?: MarketExchangeStatus;
			lifecycleStatus?: MarketLifecycleStatus;
			pickupAgreedAt?: Date;
			closedAt?: Date;
		}
	): Promise<MarketChatThreadRow | null> {
		const rows = await this.database
			.update(marketChatThreadTable)
			.set({
				...(input.seekerCompletedAt ? { seekerCompletedAt: input.seekerCompletedAt } : {}),
				...(input.sharerCompletedAt ? { sharerCompletedAt: input.sharerCompletedAt } : {}),
				...(input.exchangeStatus ? { exchangeStatus: input.exchangeStatus } : {}),
				...(input.lifecycleStatus ? { lifecycleStatus: input.lifecycleStatus } : {}),
				...(input.pickupAgreedAt ? { pickupAgreedAt: input.pickupAgreedAt } : {}),
				...(input.closedAt ? { closedAt: input.closedAt } : {})
			})
			.where(eq(marketChatThreadTable.id, threadId))
			.returning();

		return rows[0] ? mapThread(rows[0]) : null;
	}

	async markThreadRead(threadId: string, role: 'seeker' | 'sharer', readAt: Date): Promise<void> {
		await this.database
			.update(marketChatThreadTable)
			.set(role === 'seeker' ? { seekerLastReadAt: readAt } : { sharerLastReadAt: readAt })
			.where(eq(marketChatThreadTable.id, threadId));
	}

	async clearReplyReminderSentAt(threadId: string): Promise<void> {
		await this.database
			.update(marketChatThreadTable)
			.set({ replyReminderSentAt: null })
			.where(eq(marketChatThreadTable.id, threadId));
	}

	async listThreadsNeedingReplyReminder(now = new Date()): Promise<MarketChatReplyReminderCandidate[]> {
		const cutoff = new Date(now.getTime() - MARKET_CHAT_REPLY_REMINDER_MS);
		const rows = await this.database
			.select({
				thread: marketChatThreadTable,
				message: marketChatMessageTable
			})
			.from(marketChatThreadTable)
			.innerJoin(
				marketChatMessageTable,
				eq(marketChatMessageTable.threadId, marketChatThreadTable.id)
			)
			.where(
				and(
					eq(marketChatThreadTable.exchangeStatus, 'ongoing'),
					isNull(marketChatThreadTable.closedAt),
					isNull(marketChatThreadTable.replyReminderSentAt),
					sql`${marketChatMessageTable.createdAt} <= ${cutoff}`
				)
			)
			.orderBy(marketChatMessageTable.threadId, desc(marketChatMessageTable.createdAt));

		const seen = new Set<string>();
		const candidates: MarketChatReplyReminderCandidate[] = [];

		for (const row of rows) {
			if (seen.has(row.thread.id)) {
				continue;
			}
			seen.add(row.thread.id);

			const thread = mapThread(row.thread);
			const lastMessage: MarketChatMessageRow = {
				id: row.message.id,
				threadId: row.message.threadId,
				authorUserId: row.message.authorUserId,
				body: row.message.body,
				createdAt: row.message.createdAt
			};

			const recipientUserId =
				lastMessage.authorUserId === thread.seekerUserId
					? thread.sharerUserId
					: thread.seekerUserId;

			candidates.push({ thread, recipientUserId, lastMessage });
		}

		return candidates;
	}

	async markReplyReminderSent(threadId: string, sentAt: Date): Promise<void> {
		await this.database
			.update(marketChatThreadTable)
			.set({ replyReminderSentAt: sentAt })
			.where(eq(marketChatThreadTable.id, threadId));
	}

	async addRating(input: {
		id: string;
		threadId: string;
		raterUserId: string;
		ratedUserId: string;
		stars: number;
		comment?: string | null;
		itemsAsDescribed?: MarketItemsAsDescribed | null;
		revealedAt?: Date | null;
	}): Promise<MarketExchangeRatingRow> {
		const createdAt = new Date();
		await this.database.insert(marketExchangeRatingTable).values({
			id: input.id,
			threadId: input.threadId,
			raterUserId: input.raterUserId,
			ratedUserId: input.ratedUserId,
			stars: input.stars,
			comment: input.comment ?? null,
			itemsAsDescribed: input.itemsAsDescribed ?? null,
			revealedAt: input.revealedAt ?? null,
			createdAt
		});

		return {
			id: input.id,
			threadId: input.threadId,
			raterUserId: input.raterUserId,
			ratedUserId: input.ratedUserId,
			stars: input.stars,
			comment: input.comment ?? null,
			itemsAsDescribed: input.itemsAsDescribed ?? null,
			revealedAt: input.revealedAt ?? null,
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

		return this.mapRatingRow(row);
	}

	private mapRatingRow(row: typeof marketExchangeRatingTable.$inferSelect): MarketExchangeRatingRow {
		return {
			id: row.id,
			threadId: row.threadId,
			raterUserId: row.raterUserId,
			ratedUserId: row.ratedUserId,
			stars: row.stars,
			comment: row.comment,
			itemsAsDescribed: row.itemsAsDescribed,
			revealedAt: row.revealedAt,
			createdAt: row.createdAt
		};
	}

	async findRatingsForThread(threadId: string): Promise<MarketExchangeRatingRow[]> {
		const rows = await this.database
			.select()
			.from(marketExchangeRatingTable)
			.where(eq(marketExchangeRatingTable.threadId, threadId));

		return rows.map((row) => this.mapRatingRow(row));
	}

	async revealRatingsForThread(threadId: string, revealedAt: Date): Promise<void> {
		await this.database
			.update(marketExchangeRatingTable)
			.set({ revealedAt })
			.where(
				and(
					eq(marketExchangeRatingTable.threadId, threadId),
					isNull(marketExchangeRatingTable.revealedAt)
				)
			);
	}

	async listRecentRatingsForUser(userId: string, limit: number): Promise<MarketRecentReviewRow[]> {
		const rows = await this.database
			.select({
				id: marketExchangeRatingTable.id,
				stars: marketExchangeRatingTable.stars,
				comment: marketExchangeRatingTable.comment,
				createdAt: marketExchangeRatingTable.createdAt,
				raterDisplayName: userTable.displayName,
				raterMarketFirstName: userTable.marketFirstName
			})
			.from(marketExchangeRatingTable)
			.innerJoin(userTable, eq(marketExchangeRatingTable.raterUserId, userTable.id))
			.where(
				and(
					eq(marketExchangeRatingTable.ratedUserId, userId),
					isNotNull(marketExchangeRatingTable.revealedAt)
				)
			)
			.orderBy(desc(marketExchangeRatingTable.createdAt))
			.limit(limit);

		return rows;
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
			.where(
				and(
					eq(marketExchangeRatingTable.ratedUserId, ratedUserId),
					isNotNull(marketExchangeRatingTable.revealedAt)
				)
			);

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

	async createReport(input: {
		id: string;
		threadId: string;
		reporterUserId: string;
		reason: MarketChatReportReason | null;
	}): Promise<MarketChatReportRow> {
		const createdAt = new Date();
		await this.database.insert(marketChatReportTable).values({
			id: input.id,
			threadId: input.threadId,
			reporterUserId: input.reporterUserId,
			reason: input.reason,
			createdAt
		});

		return {
			id: input.id,
			threadId: input.threadId,
			reporterUserId: input.reporterUserId,
			reason: input.reason,
			dismissedAt: null,
			createdAt
		};
	}

	async listOpenReports(limit: number): Promise<MarketChatReportRow[]> {
		const rows = await this.database
			.select()
			.from(marketChatReportTable)
			.where(isNull(marketChatReportTable.dismissedAt))
			.orderBy(desc(marketChatReportTable.createdAt))
			.limit(limit);

		return rows.map((row) => ({
			id: row.id,
			threadId: row.threadId,
			reporterUserId: row.reporterUserId,
			reason: row.reason,
			dismissedAt: row.dismissedAt,
			createdAt: row.createdAt
		}));
	}

	async dismissReport(reportId: string, dismissedAt: Date): Promise<boolean> {
		const rows = await this.database
			.update(marketChatReportTable)
			.set({ dismissedAt })
			.where(and(eq(marketChatReportTable.id, reportId), isNull(marketChatReportTable.dismissedAt)))
			.returning();

		return rows.length > 0;
	}
}
