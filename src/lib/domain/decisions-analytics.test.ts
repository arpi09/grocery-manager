import { describe, expect, it } from 'vitest';
import {
	buildFunnelConversions,
	buildTopEvents,
	buildWeeklyEventTotals
} from './decisions-analytics';

describe('decisions analytics helpers', () => {
	it('ranks top events by total count', () => {
		const top = buildTopEvents(
			[
				{ day: '2026-06-01', eventType: 'scan_completed', count: 3 },
				{ day: '2026-06-02', eventType: 'scan_completed', count: 2 },
				{ day: '2026-06-01', eventType: 'receipt_parsed', count: 4 }
			],
			2
		);
		expect(top).toEqual([
			{ eventType: 'scan_completed', count: 5 },
			{ eventType: 'receipt_parsed', count: 4 }
		]);
	});

	it('groups events by registration week', () => {
		const weekly = buildWeeklyEventTotals([
			{ day: '2026-06-02', eventType: 'scan_completed', count: 1 },
			{ day: '2026-06-03', eventType: 'scan_completed', count: 2 },
			{ day: '2026-06-09', eventType: 'receipt_parsed', count: 1 }
		]);
		expect(weekly).toEqual([
			{ weekStart: '2026-06-08', eventType: 'receipt_parsed', count: 1 },
			{ weekStart: '2026-06-01', eventType: 'scan_completed', count: 3 }
		]);
	});

	it('computes funnel step conversions', () => {
		const rows = buildFunnelConversions([
			{ step: 'landing', count: 100 },
			{ step: 'signup', count: 40 },
			{ step: 'home', count: 30 }
		]);
		expect(rows[1]?.conversionFromPrevious).toBe(0.4);
		expect(rows[2]?.conversionFromPrevious).toBe(0.75);
	});
});
