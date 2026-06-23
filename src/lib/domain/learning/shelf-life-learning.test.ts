import { describe, expect, it } from 'vitest';
import {
	computeExpiresOn,
	computeTypicalDaysFromDates,
	daysBetweenIso,
	formatTodayIso,
	isHouseholdRuleReady,
	medianOf,
	predictionSourceToExpiresOnSource,
	updateMaterializedMedian
} from './shelf-life-learning';

describe('shelf-life-learning', () => {
	it('computes days between ISO dates', () => {
		expect(daysBetweenIso('2026-06-01', '2026-06-08')).toBe(7);
	});

	it('computes expiresOn from purchase date and typical days', () => {
		expect(computeExpiresOn(7, '2026-06-01')).toBe('2026-06-08');
		expect(computeExpiresOn(7, null, '2026-06-01')).toBe('2026-06-08');
	});

	it('computes typical days from reference and expiry', () => {
		expect(computeTypicalDaysFromDates('2026-06-01', '2026-06-10')).toBe(9);
	});

	it('calculates median of values', () => {
		expect(medianOf([5, 9, 7])).toBe(7);
		expect(medianOf([5, 7])).toBe(6);
	});

	it('updates materialized median with a new observation', () => {
		expect(updateMaterializedMedian(7, 2, 10)).toBe(7);
		expect(updateMaterializedMedian(7, 1, 10)).toBe(9);
	});

	it('requires minimum samples for household rule readiness', () => {
		expect(isHouseholdRuleReady(0)).toBe(false);
		expect(isHouseholdRuleReady(1)).toBe(true);
		expect(isHouseholdRuleReady(2)).toBe(true);
	});

	it('maps prediction source to expiresOnSource', () => {
		expect(predictionSourceToExpiresOnSource('household_rule')).toBe('household_learned');
		expect(predictionSourceToExpiresOnSource('heuristic')).toBe('heuristic');
		expect(predictionSourceToExpiresOnSource('location_default')).toBe('default_heuristic');
	});

	it('formats today as ISO date', () => {
		expect(formatTodayIso(new Date(2026, 5, 13))).toBe('2026-06-13');
	});
});
