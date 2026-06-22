import type { PmfService } from '$lib/application/pmf.service';
import type { MarketChatPushService } from '$lib/application/market-chat-push.service';
import { canEditInventory } from '$lib/domain/household';
import {
	hasUserMarkedExchangeComplete,
	isExchangeReadyForRating,
	isThreadUnreadForUser,
	marketThreadRoleForUser,
	type MarketExchangeStatus
} from '$lib/domain/market-exchange';
import {
	canPerformLifecycleAction,
	handoverCompletesExchange,
	isCounterpartRatingVisible,
	isThreadMessagingAllowed,
	isValidItemsAsDescribed,
	isValidRatingComment,
	nextLifecycleStatus,
	normalizeRatingComment,
	shouldSetPickupAgreedAt,
	type MarketChatReportReason,
	type MarketItemsAsDescribed,
	type MarketLifecycleStatus
} from '$lib/domain/market-lifecycle';
import {
	canStartMarketChat,
	marketAvatarUrl,
	marketFirstName,
	MARKET_CHAT_MESSAGE_MAX_LENGTH,
	type MarketPublicReview,
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

export type MarketThreadRatingView = {
	stars: number;
	comment: string | null;
	itemsAsDescribed: MarketItemsAsDescribed | null;
};

export type MarketThreadRatingResult = {
	ratingId: string;
	counterpartRating: MarketThreadRatingView | null;
};

export type MarketChatThreadSummary = MarketChatThreadRow & {
	unread: boolean;
	myMarkedComplete: boolean;
	counterpartMarkedComplete: boolean;
	counterpartFirstName: string;
};

const MESSAGE_RATE_MAX = 30;
const MESSAGE_RATE_WINDOW_MS = 60_000;

export class MarketChatService {
	constructor(
		private readonly repository: IMarketChatRepository,
		private readonly expiringShareRepository: IExpiringShareRepository,
		private readonly householdRepository: IHouseholdRepository,
		private readonly pmfService: PmfService,
		private readonly pushService?: MarketChatPushService
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

		await this.markThreadRead(thread, userId);
		const messages = await this.repository.listMessagesForThread(threadId);
		return { ok: true, data: { thread, messages } };
	}

	async listThreads(userId: string): Promise<
		MarketChatResult<{
			threads: MarketChatThreadSummary[];
			unreadCount: number;
		}>
	> {
		const threads = await this.repository.listThreadsForUser(userId);
		const latestByThread = new Map(
			(await this.repository.getLatestMessagesForThreads(threads.map((thread) => thread.id))).map(
				(message) => [message.threadId, message]
			)
		);
		const counterpartIds = threads.map((thread) =>
			userId === thread.seekerUserId ? thread.sharerUserId : thread.seekerUserId
		);
		const profiles = await this.repository.findMarketProfiles([...new Set(counterpartIds)]);
		const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));

		const summaries = threads.map((thread) => {
			const counterpartUserId =
				userId === thread.seekerUserId ? thread.sharerUserId : thread.seekerUserId;
			const counterpartProfile = profileByUserId.get(counterpartUserId);
			return {
				...this.toThreadSummary(thread, userId, latestByThread.get(thread.id) ?? null),
				counterpartFirstName: marketFirstName(counterpartProfile ?? {})
			};
		});
		const unreadCount = summaries.filter((thread) => thread.unread).length;

		return { ok: true, data: { threads: summaries, unreadCount } };
	}

	async getThreadDetail(
		threadId: string,
		userId: string
	): Promise<
		MarketChatResult<{
			thread: MarketChatThreadRow;
			messages: MarketChatMessageRow[];
			counterpart: MarketThreadParticipant;
			myRating: MarketThreadRatingView | null;
			counterpartRating: MarketThreadRatingView | null;
			myMarkedComplete: boolean;
			counterpartMarkedComplete: boolean;
		}>
	> {
		const result = await this.getThread(threadId, userId);
		if (!result.ok) {
			return result;
		}

		const { thread, messages } = result.data;
		const counterpartUserId =
			userId === thread.seekerUserId ? thread.sharerUserId : thread.seekerUserId;
		const role = marketThreadRoleForUser(thread, userId);

		const [profiles, myRating, counterpartRatingOfMe, counterpartRating] = await Promise.all([
			this.repository.findMarketProfiles([thread.seekerUserId, thread.sharerUserId]),
			this.repository.findRatingForThreadAndRater(threadId, userId),
			this.repository.findRatingForThreadAndRater(threadId, counterpartUserId),
			this.repository.getRatingSummary(counterpartUserId)
		]);

		const counterpartProfile = profiles.find((profile) => profile.userId === counterpartUserId);
		const visibleCounterpartRating =
			isCounterpartRatingVisible(myRating, counterpartRatingOfMe) && counterpartRatingOfMe
				? {
						stars: counterpartRatingOfMe.stars,
						comment: counterpartRatingOfMe.comment,
						itemsAsDescribed: counterpartRatingOfMe.itemsAsDescribed
					}
				: null;

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
				myRating: myRating
					? {
							stars: myRating.stars,
							comment: myRating.comment,
							itemsAsDescribed: myRating.itemsAsDescribed
						}
					: null,
				counterpartRating: visibleCounterpartRating,
				myMarkedComplete: role ? hasUserMarkedExchangeComplete(thread, role) : false,
				counterpartMarkedComplete:
					role === 'seeker'
						? hasUserMarkedExchangeComplete(thread, 'sharer')
						: role === 'sharer'
							? hasUserMarkedExchangeComplete(thread, 'seeker')
							: false
			}
		};
	}

	async listRecentReviewsForUser(userId: string, limit = 3): Promise<MarketPublicReview[]> {
		const rows = await this.repository.listRecentRatingsForUser(userId, limit);
		return rows.map((row) => ({
			stars: row.stars,
			comment: row.comment,
			raterFirstName: marketFirstName({
				displayName: row.raterDisplayName,
				marketFirstName: row.raterMarketFirstName
			}),
			createdAt: row.createdAt
		}));
	}

	private toRatingView(
		rating: NonNullable<Awaited<ReturnType<IMarketChatRepository['findRatingForThreadAndRater']>>>
	): MarketThreadRatingView {
		return {
			stars: rating.stars,
			comment: rating.comment,
			itemsAsDescribed: rating.itemsAsDescribed
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

		if (!isThreadMessagingAllowed(thread.lifecycleStatus)) {
			return { ok: false, error: 'closed' };
		}

		if (thread.exchangeStatus === 'completed' || thread.closedAt) {
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

		const recipientUserId =
			input.userId === thread.seekerUserId ? thread.sharerUserId : thread.seekerUserId;
		void this.pushService?.notifyNewMessage({
			threadId: input.threadId,
			senderUserId: input.userId,
			recipientUserId,
			bodyPreview: body
		});

		return { ok: true, data: { message } };
	}

	async proposePickup(input: {
		threadId: string;
		userId: string;
		message?: string;
		householdId: string | null;
	}): Promise<
		MarketChatResult<{ thread: MarketChatThreadRow; message: MarketChatMessageRow | null }>
	> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		if (!canPerformLifecycleAction(thread.lifecycleStatus, 'propose_pickup')) {
			return { ok: false, error: 'closed' };
		}

		const nextStatus = nextLifecycleStatus(thread.lifecycleStatus, 'propose_pickup');
		if (!nextStatus) {
			return { ok: false, error: 'closed' };
		}

		const agreedAt = new Date();
		const updated = await this.repository.markExchangeComplete(input.threadId, {
			lifecycleStatus: nextStatus,
			pickupAgreedAt: agreedAt
		});

		if (!updated) {
			return { ok: false, error: 'not_found' };
		}

		const body = input.message?.trim();
		let message: MarketChatMessageRow | null = null;
		if (body) {
			if (body.length > MARKET_CHAT_MESSAGE_MAX_LENGTH) {
				return { ok: false, error: 'validation' };
			}
			message = await this.repository.addMessage({
				id: crypto.randomUUID(),
				threadId: input.threadId,
				authorUserId: input.userId,
				body
			});
		}

		return { ok: true, data: { thread: updated, message } };
	}

	async confirmPickupAgreement(input: {
		threadId: string;
		userId: string;
		householdId: string | null;
	}): Promise<MarketChatResult<{ thread: MarketChatThreadRow }>> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		if (!canPerformLifecycleAction(thread.lifecycleStatus, 'confirm_pickup_agreement')) {
			return { ok: false, error: 'closed' };
		}

		const nextStatus = nextLifecycleStatus(thread.lifecycleStatus, 'confirm_pickup_agreement');
		if (!nextStatus) {
			return { ok: false, error: 'closed' };
		}

		const updateInput: {
			lifecycleStatus: MarketLifecycleStatus;
			pickupAgreedAt?: Date;
		} = { lifecycleStatus: nextStatus };

		if (shouldSetPickupAgreedAt(thread.lifecycleStatus, 'confirm_pickup_agreement')) {
			updateInput.pickupAgreedAt = new Date();
		}

		const updated = await this.repository.markExchangeComplete(input.threadId, updateInput);
		if (!updated) {
			return { ok: false, error: 'not_found' };
		}

		return { ok: true, data: { thread: updated } };
	}

	async confirmHandover(input: {
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

		if (thread.lifecycleStatus === 'completed' || thread.closedAt) {
			return { ok: true, data: { thread } };
		}

		if (!canPerformLifecycleAction(thread.lifecycleStatus, 'confirm_handover')) {
			return { ok: false, error: 'closed' };
		}

		const role = marketThreadRoleForUser(thread, input.userId);
		if (!role) {
			return { ok: false, error: 'forbidden' };
		}

		if (hasUserMarkedExchangeComplete(thread, role)) {
			return { ok: true, data: { thread } };
		}

		const markedAt = new Date();
		const nextSeekerCompletedAt = role === 'seeker' ? markedAt : thread.seekerCompletedAt;
		const nextSharerCompletedAt = role === 'sharer' ? markedAt : thread.sharerCompletedAt;
		const bothComplete = handoverCompletesExchange(nextSeekerCompletedAt, nextSharerCompletedAt);
		const lifecycleStatus: MarketLifecycleStatus = bothComplete ? 'completed' : 'awaiting_handover';

		const updated = await this.repository.markExchangeComplete(input.threadId, {
			...(role === 'seeker' ? { seekerCompletedAt: markedAt } : { sharerCompletedAt: markedAt }),
			lifecycleStatus,
			...(bothComplete
				? { exchangeStatus: 'completed' as MarketExchangeStatus, closedAt: markedAt }
				: {})
		});

		if (!updated) {
			const latest = await this.repository.findThreadById(input.threadId);
			if (!latest) {
				return { ok: false, error: 'not_found' };
			}
			return { ok: true, data: { thread: latest } };
		}

		return { ok: true, data: { thread: updated } };
	}

	async markExchangeComplete(input: {
		threadId: string;
		userId: string;
	}): Promise<MarketChatResult<{ thread: MarketChatThreadRow }>> {
		return this.confirmHandover(input);
	}

	/** @deprecated Use confirmHandover — kept for route alias. */
	async closeThread(input: {
		threadId: string;
		userId: string;
	}): Promise<MarketChatResult<{ thread: MarketChatThreadRow }>> {
		return this.confirmHandover(input);
	}

	async rateThread(input: {
		threadId: string;
		userId: string;
		stars: number;
		comment?: string | null;
		itemsAsDescribed?: MarketItemsAsDescribed | null;
		householdId: string | null;
	}): Promise<MarketChatResult<MarketThreadRatingResult>> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		if (!isExchangeReadyForRating(thread)) {
			return { ok: false, error: 'closed' };
		}

		if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
			return { ok: false, error: 'validation' };
		}

		const comment = normalizeRatingComment(input.comment);
		if (!isValidRatingComment(comment)) {
			return { ok: false, error: 'validation' };
		}

		if (!isValidItemsAsDescribed(input.itemsAsDescribed ?? null)) {
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

		const counterpartExisting = await this.repository.findRatingForThreadAndRater(
			input.threadId,
			ratedUserId
		);

		const ratingId = crypto.randomUUID();
		await this.repository.addRating({
			id: ratingId,
			threadId: input.threadId,
			raterUserId: input.userId,
			ratedUserId,
			stars: input.stars,
			comment,
			itemsAsDescribed: input.itemsAsDescribed ?? null
		});

		let counterpartRating: MarketThreadRatingView | null = null;
		if (counterpartExisting) {
			const revealedAt = new Date();
			await this.repository.revealRatingsForThread(input.threadId, revealedAt);
			counterpartRating = this.toRatingView(counterpartExisting);
		}

		recordProductEvent(this.pmfService, {
			userId: input.userId,
			householdId: input.householdId,
			eventType: 'market_exchange_rated',
			metadata: {
				threadId: input.threadId,
				ratedUserId,
				stars: input.stars,
				hasComment: comment != null,
				itemsAsDescribed: input.itemsAsDescribed ?? null,
				revealed: counterpartExisting != null
			}
		});

		return { ok: true, data: { ratingId, counterpartRating } };
	}

	async cancelThread(input: {
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

		if (!canPerformLifecycleAction(thread.lifecycleStatus, 'cancel')) {
			return { ok: false, error: 'closed' };
		}

		const nextStatus = nextLifecycleStatus(thread.lifecycleStatus, 'cancel');
		if (!nextStatus) {
			return { ok: false, error: 'closed' };
		}

		const closedAt = new Date();
		const updated = await this.repository.markExchangeComplete(input.threadId, {
			lifecycleStatus: nextStatus,
			closedAt
		});

		if (!updated) {
			return { ok: false, error: 'not_found' };
		}

		return { ok: true, data: { thread: updated } };
	}

	async blockThreadCounterpart(input: {
		threadId: string;
		userId: string;
	}): Promise<MarketChatResult<{ blocked: true }>> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.userId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		await this.blockCounterpartForReporter(input.userId, thread);
		return { ok: true, data: { blocked: true } };
	}

	async reportThread(input: {
		threadId: string;
		reporterUserId: string;
		reason: MarketChatReportReason;
		blockCounterpart?: boolean;
	}): Promise<MarketChatResult<{ reportId: string; thread: MarketChatThreadRow }>> {
		const thread = await this.repository.findThreadById(input.threadId);
		if (!thread) {
			return { ok: false, error: 'not_found' };
		}

		if (!(await this.canAccessThread(input.reporterUserId, thread))) {
			return { ok: false, error: 'forbidden' };
		}

		if (!canPerformLifecycleAction(thread.lifecycleStatus, 'report')) {
			return { ok: false, error: 'closed' };
		}

		const nextStatus = nextLifecycleStatus(thread.lifecycleStatus, 'report');
		if (!nextStatus) {
			return { ok: false, error: 'closed' };
		}

		const report = await this.repository.createReport({
			id: crypto.randomUUID(),
			threadId: input.threadId,
			reporterUserId: input.reporterUserId,
			reason: input.reason
		});

		if (input.blockCounterpart) {
			await this.blockCounterpartForReporter(input.reporterUserId, thread);
		}

		const closedAt = new Date();
		const updated = await this.repository.markExchangeComplete(input.threadId, {
			lifecycleStatus: nextStatus,
			closedAt
		});

		if (!updated) {
			return { ok: false, error: 'not_found' };
		}

		return { ok: true, data: { reportId: report.id, thread: updated } };
	}

	async listOpenChatReports(limit: number) {
		return this.repository.listOpenReports(limit);
	}

	async dismissChatReport(reportId: string): Promise<MarketChatResult<{ dismissed: boolean }>> {
		const dismissed = await this.repository.dismissReport(reportId, new Date());
		if (!dismissed) {
			return { ok: false, error: 'not_found' };
		}
		return { ok: true, data: { dismissed: true } };
	}

	private toThreadSummary(
		thread: MarketChatThreadRow,
		userId: string,
		latestMessage: { authorUserId: string; createdAt: Date } | null
	): Omit<MarketChatThreadSummary, 'counterpartFirstName'> {
		const role = marketThreadRoleForUser(thread, userId);
		return {
			...thread,
			unread: isThreadUnreadForUser(thread, userId, latestMessage),
			myMarkedComplete: role ? hasUserMarkedExchangeComplete(thread, role) : false,
			counterpartMarkedComplete:
				role === 'seeker'
					? hasUserMarkedExchangeComplete(thread, 'sharer')
					: role === 'sharer'
						? hasUserMarkedExchangeComplete(thread, 'seeker')
						: false
		};
	}

	private async markThreadRead(thread: MarketChatThreadRow, userId: string): Promise<void> {
		const role = marketThreadRoleForUser(thread, userId);
		if (!role) {
			return;
		}
		await this.repository.markThreadRead(thread.id, role, new Date());
	}

	private async canAccessThread(userId: string, thread: MarketChatThreadRow): Promise<boolean> {
		if (userId === thread.seekerUserId || userId === thread.sharerUserId) {
			return true;
		}

		const role = await this.householdRepository.getMemberRole(thread.householdId, userId);
		return role != null && canEditInventory(role);
	}

	private async blockCounterpartForReporter(
		reporterUserId: string,
		thread: MarketChatThreadRow
	): Promise<void> {
		await this.expiringShareRepository.blockShareForReporter({
			id: crypto.randomUUID(),
			reporterUserId,
			shareId: thread.shareId
		});
		await this.expiringShareRepository.blockHouseholdForReporter({
			id: crypto.randomUUID(),
			reporterUserId,
			householdId: thread.householdId
		});
	}
}
