export type MarketLifecycleStatus =
	| 'chatting'
	| 'pickup_agreed'
	| 'awaiting_handover'
	| 'completed'
	| 'cancelled'
	| 'reported';

export type MarketLifecycleAction =
	| 'propose_pickup'
	| 'confirm_pickup_agreement'
	| 'confirm_handover'
	| 'cancel'
	| 'report';

export type MarketChatReportReason =
	| 'inappropriate'
	| 'no_show'
	| 'misleading'
	| 'unsafe'
	| 'other';

export type MarketItemsAsDescribed = 'yes' | 'partial' | 'no';

export const MARKET_LIFECYCLE_TERMINAL: readonly MarketLifecycleStatus[] = [
	'completed',
	'cancelled',
	'reported'
];

export const MARKET_CHAT_REPORT_REASONS: readonly MarketChatReportReason[] = [
	'inappropriate',
	'no_show',
	'misleading',
	'unsafe',
	'other'
];

export const MARKET_RATING_COMMENT_MAX_LENGTH = 120;

const LIFECYCLE_TRANSITIONS: Record<
	MarketLifecycleAction,
	Partial<Record<MarketLifecycleStatus, MarketLifecycleStatus>>
> = {
	propose_pickup: {
		chatting: 'pickup_agreed'
	},
	confirm_pickup_agreement: {
		chatting: 'awaiting_handover',
		pickup_agreed: 'awaiting_handover'
	},
	confirm_handover: {
		chatting: 'awaiting_handover',
		pickup_agreed: 'awaiting_handover',
		awaiting_handover: 'awaiting_handover'
	},
	cancel: {
		chatting: 'cancelled',
		pickup_agreed: 'cancelled',
		awaiting_handover: 'cancelled'
	},
	report: {
		chatting: 'reported',
		pickup_agreed: 'reported',
		awaiting_handover: 'reported'
	}
};

export interface MarketLifecycleThreadFields {
	lifecycleStatus: MarketLifecycleStatus;
	pickupAgreedAt: Date | null;
}

export function isTerminalLifecycleStatus(status: MarketLifecycleStatus): boolean {
	return (MARKET_LIFECYCLE_TERMINAL as readonly string[]).includes(status);
}

export function canPerformLifecycleAction(
	status: MarketLifecycleStatus,
	action: MarketLifecycleAction
): boolean {
	if (isTerminalLifecycleStatus(status)) {
		return false;
	}
	return LIFECYCLE_TRANSITIONS[action][status] != null;
}

export function nextLifecycleStatus(
	current: MarketLifecycleStatus,
	action: MarketLifecycleAction
): MarketLifecycleStatus | null {
	return LIFECYCLE_TRANSITIONS[action][current] ?? null;
}

/** 0 = Pratar … 3 = Betyg (completed / rated phase). */
export function lifecycleStepIndex(status: MarketLifecycleStatus): number {
	switch (status) {
		case 'chatting':
			return 0;
		case 'pickup_agreed':
			return 1;
		case 'awaiting_handover':
			return 2;
		case 'completed':
			return 3;
		case 'cancelled':
		case 'reported':
			return 2;
		default:
			return 0;
	}
}

export function isThreadMessagingAllowed(status: MarketLifecycleStatus): boolean {
	return !isTerminalLifecycleStatus(status);
}

export function shouldSetPickupAgreedAt(
	current: MarketLifecycleStatus,
	action: MarketLifecycleAction
): boolean {
	return action === 'propose_pickup' || (action === 'confirm_pickup_agreement' && current === 'chatting');
}

export function handoverCompletesExchange(
	seekerCompletedAt: Date | null,
	sharerCompletedAt: Date | null
): boolean {
	return seekerCompletedAt != null && sharerCompletedAt != null;
}

/** Default "block from future chats" when reporting — on for serious reasons. */
export function defaultBlockForReportReason(reason: MarketChatReportReason): boolean {
	return reason === 'unsafe' || reason === 'inappropriate';
}

export function normalizeRatingComment(comment: string | null | undefined): string | null {
	if (comment == null) {
		return null;
	}
	const trimmed = comment.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function isValidRatingComment(comment: string | null | undefined): boolean {
	const normalized = normalizeRatingComment(comment);
	if (normalized == null) {
		return true;
	}
	return normalized.length <= MARKET_RATING_COMMENT_MAX_LENGTH;
}

export function isValidItemsAsDescribed(
	value: string | null | undefined
): value is MarketItemsAsDescribed | null {
	if (value == null || value === '') {
		return true;
	}
	return value === 'yes' || value === 'partial' || value === 'no';
}

/** Counterpart rating visible only after viewer rated and rating is revealed. */
export function isCounterpartRatingVisible(
	myRating: { id: string } | null,
	counterpartRating: { revealedAt: Date | null } | null
): boolean {
	return myRating != null && counterpartRating != null && counterpartRating.revealedAt != null;
}
