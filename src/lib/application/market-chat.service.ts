import type { PmfService } from '$lib/application/pmf.service';
import { canEditInventory } from '$lib/domain/household';
import {
	canStartMarketChat,
	marketAvatarUrl,
	marketFirstName,
	MARKET_CHAT_MESSAGE_MAX_LENGTH,
	type MarketRatingSummary
} from '$lib/domain/market-profile';
import type {
	IMarketChatRepository,
	MarketChatMessageRow,
	MarketChatThreadRow
} from '$lib/infrastructure/repositories/market-chat.repository';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';
import { recordProductEvent } from '$lib/server/product-events';

export type MarketChatErrorCode =
	| 'not_found'
	| 'forbidden'
	| 'blocked'
	| 'rate_limited'
	| 'validation'
	| 'conflict'
	| 'closed';

export type MarketChatResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: MarketChatErrorCode };

export type MarketThreadParticipant = {
	userId: string;
	firstName: string;
	avatarUrl: string | null;
	rating: MarketRatingSummary;
};

const MESSAGE_RATE_MAX = 30;
const MESSAGE_RATE_WINDOW_MS = 60_000;

export class MarketChatService {
	constructor(
		private readonly repository: IMarketChatRepository,
		private readonly expiringShareRepository: IExpiringShareRepository,
		private readonly householdRepository: IHouseholdRepository,
		private readonly pmfService: PmfService
	) {}

	async createOrGetThread(input: {
		shareId: string;
		seekerUserId: string;
		seekerHouseholdId: string;
	}): Promise<
		MarketChatResult<{
			thread: MarketChatThreadRow;
			created: boolean;
			messages: MarketChatMessageRow[];
		}>
	> {
		if (!canStartMarketChat()) {
			return { ok: false, error: 'forbidden' };
		}

		const share = await this.expiringShareRepository.findShareForNearbyPush(input.shareId);
		if (!share) {
			return { ok: false, error: 'not_found' };
		}

		if (share.householdId === input.seekerHouseholdId) {
			return { ok: false, error: 'forbidden' };
		}

		const [blockedShareIds, blockedHouseholdIds] = await Promise.all([
			this.expiringShareRepository.getBlockedShareIds(input.seekerUserId),
			this.expiringShareRepository.getBlockedHouseholdIds(input.seekerUserId)
		]);

		if (
			blockedShareIds.includes(input.shareId) ||
			blockedHouseholdIds.includes(share.householdId)
		) {
			return { ok: false, error: 'blocked' };
		}

		const { thread, created } = await this.repository.createOrGetThread({
			id: crypto.randomUUID(),
			shareId: input.shareId,
			seekerUserId: input.seekerUserId,
			sharerUserId: share.createdByUserId,
			householdId: share.householdId
		});

		if (created) {
			recordProductEvent(this.pmfService, {
				userId: input.seekerUserId,
				householdId: input.seekerHouseholdId,
				eventType: 'market_chat_started',
				metadata: {
					threadId: thread.id,
					shareId: input.shareId
				}
			});
		}

		const messages = await this.repository.listMessagesForThread(thread.id);
		return { ok: true, data: { thread, created, messages } };
	}

	async getThread(
		threadId: string,
		userId: string
	): Promise<
		MarketChatResult<{
			thread: MarketChatThreadRow;
			messages: MarketChatMessageRow[];
		}>
	> {
		const thread = await this.repository.findThreadById(threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		const messages = await this.repository.listMessagesForThread(threadId);
		return { ok: true, data: { thread, messages } };
	}

	async listThreads(userId: string): Promise<MarketChatResult<{ threads: MarketChatThreadRow[] }>> {
		const threads = await this.repository.listThreadsForUser(userId);
		return { ok: true, data: { threads } };
	}

	async getThreadDetail(
		threadId: string,
		userId: string
	): Promise<
		MarketChatResult<{
			thread: MarketChatThreadRow;
			messages: MarketChatMessageRow[];
			counterpart: MarketThreadParticipant;
			myRating: { stars: number } | null;
		}>
	> {
		const result = await this.getThread(threadId, userId);
		if (!result.ok) {
			return result;
		}

		const { thread, messages } = result.data;
		const counterpartUserId =
			userId === thread.seekerUserId ? thread.sharerUserId : thread.seekerUserId;

		const [profiles, myRating, counterpartRating] = await Promise.all([
			this.repository.findMarketProfiles([thread.seekerUserId, thread.sharerUserId]),
			this.repository.findRatingForThreadAndRater(threadId, userId),
			this.repository.getRatingSummary(counterpartUserId)
		]);

		const counterpartProfile = profiles.find((profile) => profile.userId === counterpartUserId);

		return {
			ok: true,
			data: {
				thread,
				messages,
				counterpart: {
					userId: counterpartUserId,
					firstName: marketFirstName(counterpartProfile ?? {}),
					avatarUrl: marketAvatarUrl(counterpartProfile ?? {}),
					rating: {
						averageStars: counterpartRating.averageStars,
						ratingCount: counterpartRating.ratingCount
					}
				},
				myRating: myRating ? { stars: myRating.stars } : null
			}
		};
	}

	async sendMessage(input: {
		threadId: string;
		userId: string;
		body: string;
		householdId: string | null;
	}): Promise<MarketChatResult<{ message: MarketChatMessageRow }>> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		if (thread.closedAt) {
			return { ok: false, error: 'closed' };
		}

		const body = input.body.trim();
		if (!body || body.length > MARKET_CHAT_MESSAGE_MAX_LENGTH) {
			return { ok: false, error: 'validation' };
		}

		if (!consumeRateLimit(`market-chat-msg:${input.userId}`, MESSAGE_RATE_MAX, MESSAGE_RATE_WINDOW_MS)) {
			return { ok: false, error: 'rate_limited' };
		}

		const message = await this.repository.addMessage({
			id: crypto.randomUUID(),
			threadId: input.threadId,
			authorUserId: input.userId,
			body
		});

		recordProductEvent(this.pmfService, {
			userId: input.userId,
			householdId: input.householdId,
			eventType: 'market_chat_message_sent',
			metadata: {
				threadId: input.threadId,
				messageId: message.id
			}
		});

		return { ok: true, data: { message } };
	}

	async closeThread(input: {
		threadId: string;
		userId: string;
	}): Promise<MarketChatResult<{ thread: MarketChatThreadRow }>> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		if (thread.closedAt) {
			return { ok: true, data: { thread } };
		}

		const closedAt = new Date();
		const updated = await this.repository.closeThread(input.threadId, closedAt);
		if (!updated) {
			const latest = await this.repository.findThreadById(input.threadId);
			if (!latest) {
				return { ok: false, error: 'not_found' };
			}
			return { ok: true, data: { thread: latest } };
		}

		return {
			ok: true,
			data: {
				thread: { ...thread, closedAt }
			}
		};
	}

	async rateThread(input: {
		threadId: string;
		userId: string;
		stars: number;
		householdId: string | null;
	}): Promise<MarketChatResult<{ ratingId: string }>> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
			return { ok: false, error: 'validation' };
		}

		const existing = await this.repository.findRatingForThreadAndRater(
			input.threadId,
			input.userId
		);
		if (existing) {
			return { ok: false, error: 'conflict' };
		}

		const ratedUserId =
			input.userId === thread.seekerUserId ? thread.sharerUserId : thread.seekerUserId;

		const rating = await this.repository.addRating({
			id: crypto.randomUUID(),
			threadId: input.threadId,
			raterUserId: input.userId,
			ratedUserId,
			stars: input.stars
		});

		recordProductEvent(this.pmfService, {
			userId: input.userId,
			householdId: input.householdId,
			eventType: 'market_exchange_rated',
			metadata: {
				threadId: input.threadId,
				ratedUserId,
				stars: input.stars
			}
		});

		return { ok: true, data: { ratingId: rating.id } };
	}

	private async canAccessThread(userId: string, thread: MarketChatThreadRow): Promise<boolean> {
		if (userId === thread.seekerUserId || userId === thread.sharerUserId) {
			return true;
		}

		const role = await this.householdRepository.getMemberRole(thread.householdId, userId);
		return role != null && canEditInventory(role);
	}
}
