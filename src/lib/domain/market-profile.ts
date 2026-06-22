export const MARKET_CHAT_MESSAGE_MAX_LENGTH = 2000;

export interface MarketProfileUser {
	displayName?: string | null;
	marketFirstName?: string | null;
	avatarUrl?: string | null;
}

export interface MarketRatingRow {
	stars: number;
}

export interface MarketRatingSummary {
	averageStars: number | null;
	ratingCount: number;
}

export interface MarketPublicReview {
	stars: number;
	comment: string | null;
	raterFirstName: string;
	createdAt: Date | string;
}

export function marketFirstName(user: MarketProfileUser): string {
	const explicit = user.marketFirstName?.trim();
	if (explicit) {
		return explicit;
	}

	const display = user.displayName?.trim();
	if (display) {
		const first = display.split(/\s+/).filter(Boolean)[0];
		if (first) {
			return first;
		}
	}

	return 'Granne';
}

export function marketAvatarUrl(user: MarketProfileUser): string | null {
	const url = user.avatarUrl?.trim();
	return url ? url : null;
}

export function hasMarketAvatar(user: MarketProfileUser): boolean {
	return marketAvatarUrl(user) != null;
}

export function buildMarketRatingSummary(ratings: MarketRatingRow[]): MarketRatingSummary {
	if (ratings.length === 0) {
		return { averageStars: null, ratingCount: 0 };
	}

	const sum = ratings.reduce((total, row) => total + row.stars, 0);
	return {
		averageStars: sum / ratings.length,
		ratingCount: ratings.length
	};
}

/** Soft gate for Phase 1 — always allow starting chat when backend is on. */
export function canStartMarketChat(): boolean {
	return true;
}

export function prefersMarketAvatarSetup(user: MarketProfileUser): boolean {
	return !hasMarketAvatar(user) || !user.marketFirstName?.trim();
}
