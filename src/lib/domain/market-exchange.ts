import type { MarketLifecycleStatus } from '$lib/domain/market-lifecycle';

export type MarketExchangeStatus = 'ongoing' | 'completed';

export type MarketThreadParticipantRole = 'seeker' | 'sharer';

export interface MarketExchangeThreadFields {
	seekerUserId: string;
	sharerUserId: string;
	exchangeStatus: MarketExchangeStatus;
	lifecycleStatus: MarketLifecycleStatus;
	pickupAgreedAt: Date | null;
	seekerCompletedAt: Date | null;
	sharerCompletedAt: Date | null;
	closedAt: Date | null;
}

export interface MarketThreadReadFields extends MarketExchangeThreadFields {
	seekerLastReadAt: Date | null;
	sharerLastReadAt: Date | null;
}

export function marketThreadRoleForUser(
	thread: Pick<MarketExchangeThreadFields, 'seekerUserId' | 'sharerUserId'>,
	userId: string
): MarketThreadParticipantRole | null {
	if (userId === thread.seekerUserId) {
		return 'seeker';
	}
	if (userId === thread.sharerUserId) {
		return 'sharer';
	}
	return null;
}

export function hasUserMarkedExchangeComplete(
	thread: MarketExchangeThreadFields,
	role: MarketThreadParticipantRole
): boolean {
	return role === 'seeker' ? thread.seekerCompletedAt != null : thread.sharerCompletedAt != null;
}

export function bothPartiesMarkedExchangeComplete(thread: MarketExchangeThreadFields): boolean {
	return thread.seekerCompletedAt != null && thread.sharerCompletedAt != null;
}

export function isExchangeReadyForRating(thread: MarketExchangeThreadFields): boolean {
	return (
		thread.lifecycleStatus === 'completed' ||
		thread.exchangeStatus === 'completed' ||
		thread.closedAt != null ||
		bothPartiesMarkedExchangeComplete(thread)
	);
}

export function isThreadUnreadForUser(
	thread: MarketThreadReadFields,
	userId: string,
	latestMessage: { authorUserId: string; createdAt: Date } | null
): boolean {
	if (!latestMessage || latestMessage.authorUserId === userId) {
		return false;
	}

	const role = marketThreadRoleForUser(thread, userId);
	if (!role) {
		return false;
	}

	const lastReadAt = role === 'seeker' ? thread.seekerLastReadAt : thread.sharerLastReadAt;
	if (!lastReadAt) {
		return true;
	}

	return latestMessage.createdAt.getTime() > lastReadAt.getTime();
}

export const MARKET_CHAT_REPLY_REMINDER_MS = 24 * 60 * 60 * 1000;
