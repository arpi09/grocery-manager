import { describe, expect, it } from 'vitest';
import {
	buildMarketV01MetricsSnapshot,
	emptyMarketV01EventCounts
} from './market-v01-metrics';

describe('market-v01-metrics', () => {
	it('computes chat to rated conversion', () => {
		const counts = emptyMarketV01EventCounts();
		counts.market_chat_started = 4;
		counts.market_exchange_rated = 1;

		const snapshot = buildMarketV01MetricsSnapshot({
			counts,
			activeAutoListings: 0,
			periodStart: new Date('2026-06-01'),
			periodEnd: new Date('2026-06-08')
		});

		expect(snapshot.chatToRatedConversion).toBe(0.25);
	});
});
