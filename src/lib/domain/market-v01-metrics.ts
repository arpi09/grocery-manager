import type { ProductEventType } from '$lib/domain/pmf';

export const MARKET_V01_METRIC_PERIOD_DAYS = 7;

export const MARKET_V01_METRIC_EVENT_TYPES = [
	'market_auto_listing_published',
	'market_auto_listing_cleared',
	'market_listing_viewed',
	'market_chat_started',
	'market_chat_message_sent',
	'market_exchange_rated'
] as const satisfies readonly ProductEventType[];

export type MarketV01MetricEventType = (typeof MARKET_V01_METRIC_EVENT_TYPES)[number];

export interface MarketV01EventCounts {
	market_auto_listing_published: number;
	market_auto_listing_cleared: number;
	market_listing_viewed: number;
	market_chat_started: number;
	market_chat_message_sent: number;
	market_exchange_rated: number;
}

export interface MarketV01MetricsSnapshot {
	periodDays: number;
	periodStart: Date;
	periodEnd: Date;
	activeAutoListings: number;
	counts: MarketV01EventCounts;
	listingToChatConversion: number | null;
}

export function emptyMarketV01EventCounts(): MarketV01EventCounts {
	return {
		market_auto_listing_published: 0,
		market_auto_listing_cleared: 0,
		market_listing_viewed: 0,
		market_chat_started: 0,
		market_chat_message_sent: 0,
		market_exchange_rated: 0
	};
}

export function buildMarketV01MetricsSnapshot(input: {
	counts: MarketV01EventCounts;
	activeAutoListings: number;
	periodStart: Date;
	periodEnd: Date;
	periodDays?: number;
}): MarketV01MetricsSnapshot {
	const views = input.counts.market_listing_viewed;
	const chats = input.counts.market_chat_started;

	return {
		periodDays: input.periodDays ?? MARKET_V01_METRIC_PERIOD_DAYS,
		periodStart: input.periodStart,
		periodEnd: input.periodEnd,
		activeAutoListings: input.activeAutoListings,
		counts: input.counts,
		listingToChatConversion: views > 0 ? chats / views : null
	};
}
