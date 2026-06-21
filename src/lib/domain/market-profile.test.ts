import { describe, expect, it } from 'vitest';
import {
	buildMarketRatingSummary,
	canStartMarketChat,
	hasMarketAvatar,
	marketAvatarUrl,
	marketFirstName,
	MARKET_CHAT_MESSAGE_MAX_LENGTH,
	prefersMarketAvatarSetup
} from './market-profile';

describe('market-profile helpers', () => {
	it('exposes message max length', () => {
		expect(MARKET_CHAT_MESSAGE_MAX_LENGTH).toBe(2000);
	});

	it('prefers marketFirstName then displayName first token', () => {
		expect(marketFirstName({ marketFirstName: '  Lisa  ' })).toBe('Lisa');
		expect(marketFirstName({ displayName: 'Anna Andersson' })).toBe('Anna');
		expect(marketFirstName({})).toBe('Granne');
	});

	it('reads avatar url when present', () => {
		expect(marketAvatarUrl({ avatarUrl: ' https://cdn.example/a.png ' })).toBe(
			'https://cdn.example/a.png'
		);
		expect(marketAvatarUrl({ avatarUrl: '  ' })).toBeNull();
		expect(hasMarketAvatar({ avatarUrl: 'https://cdn.example/a.png' })).toBe(true);
		expect(hasMarketAvatar({})).toBe(false);
	});

	it('builds rating summary', () => {
		expect(buildMarketRatingSummary([])).toEqual({ averageStars: null, ratingCount: 0 });
		expect(buildMarketRatingSummary([{ stars: 4 }, { stars: 2 }])).toEqual({
			averageStars: 3,
			ratingCount: 2
		});
	});

	it('soft gate always allows chat start', () => {
		expect(canStartMarketChat()).toBe(true);
	});

	it('detects avatar setup preference', () => {
		expect(prefersMarketAvatarSetup({ marketFirstName: 'Bo', avatarUrl: 'x' })).toBe(false);
		expect(prefersMarketAvatarSetup({ marketFirstName: 'Bo' })).toBe(true);
		expect(prefersMarketAvatarSetup({ avatarUrl: 'x' })).toBe(true);
	});
});
