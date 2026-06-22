import type { MarketLifecycleStatus } from '$lib/domain/market-lifecycle';
import { isTerminalLifecycleStatus } from '$lib/domain/market-lifecycle';
import type { Locale } from '$lib/i18n';

export type MarketInboxSegment = 'active' | 'closed';

export type MarketInboxListingPreview = {
	title: string;
	pricingMode?: 'free' | 'percent_of_reference' | 'fixed';
	askingPriceSek?: number;
};

export function isActiveInboxThread(input: {
	lifecycleStatus: MarketLifecycleStatus;
	closedAt?: Date | string | null;
}): boolean {
	return !isTerminalLifecycleStatus(input.lifecycleStatus) && input.closedAt == null;
}

export function filterInboxThreadsBySegment<
	T extends { lifecycleStatus: MarketLifecycleStatus; closedAt?: Date | string | null }
>(threads: T[], segment: MarketInboxSegment): T[] {
	return threads.filter((thread) =>
		segment === 'active' ? isActiveInboxThread(thread) : !isActiveInboxThread(thread)
	);
}

export function formatMarketInboxRelativeTime(date: Date, locale: Locale, now = new Date()): string {
	const diffMs = date.getTime() - now.getTime();
	const diffMinutes = Math.round(diffMs / 60_000);
	const rtf = new Intl.RelativeTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { numeric: 'auto' });

	if (Math.abs(diffMinutes) < 1) {
		return rtf.format(0, 'minute');
	}
	if (Math.abs(diffMinutes) < 60) {
		return rtf.format(diffMinutes, 'minute');
	}

	const diffHours = Math.round(diffMinutes / 60);
	if (Math.abs(diffHours) < 24) {
		return rtf.format(diffHours, 'hour');
	}

	const diffDays = Math.round(diffHours / 24);
	if (Math.abs(diffDays) < 7) {
		return rtf.format(diffDays, 'day');
	}

	return date.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-GB', {
		day: 'numeric',
		month: 'short'
	});
}
