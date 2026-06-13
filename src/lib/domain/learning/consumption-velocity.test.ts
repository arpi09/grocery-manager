import { describe, expect, it } from 'vitest';
import {
	CONSUMPTION_VELOCITY_MIN_EARLY_DAYS,
	CONSUMPTION_VELOCITY_MIN_LATE_DAYS,
	computeTypicalDaysFromPurchaseAndConsume
} from './consumption-velocity';

describe('computeTypicalDaysFromPurchaseAndConsume', () => {
	it('returns strong signal when finished well before estimated expiry', () => {
		expect(
			computeTypicalDaysFromPurchaseAndConsume('2026-06-01', '2026-06-04', '2026-06-10')
		).toEqual({ typicalDays: 3, strength: 'strong' });
	});

	it('returns null when finished only slightly before estimated expiry', () => {
		const expiresOn = '2026-06-08';
		const consumedAt = '2026-06-07';
		expect(
			computeTypicalDaysFromPurchaseAndConsume('2026-06-01', consumedAt, expiresOn)
		).toBeNull();
		expect(CONSUMPTION_VELOCITY_MIN_EARLY_DAYS).toBeGreaterThan(
			daysBetween('2026-06-01', expiresOn) - daysBetween('2026-06-01', consumedAt)
		);
	});

	it('returns weak signal when consumed after estimated expiry', () => {
		expect(
			computeTypicalDaysFromPurchaseAndConsume('2026-06-01', '2026-06-12', '2026-06-10')
		).toEqual({ typicalDays: 11, strength: 'weak' });
	});

	it('returns null when consumed on estimated expiry day', () => {
		expect(
			computeTypicalDaysFromPurchaseAndConsume('2026-06-01', '2026-06-08', '2026-06-08')
		).toBeNull();
	});

	it('returns null when consumed before purchase date', () => {
		expect(
			computeTypicalDaysFromPurchaseAndConsume('2026-06-05', '2026-06-03', '2026-06-10')
		).toBeNull();
	});

	it('respects minimum late margin constant', () => {
		expect(CONSUMPTION_VELOCITY_MIN_LATE_DAYS).toBe(1);
		expect(
			computeTypicalDaysFromPurchaseAndConsume('2026-06-01', '2026-06-10', '2026-06-10')
		).toBeNull();
	});
});

function daysBetween(fromIso: string, toIso: string): number {
	const [fromY, fromM, fromD] = fromIso.split('-').map(Number);
	const [toY, toM, toD] = toIso.split('-').map(Number);
	const from = new Date(fromY, fromM - 1, fromD);
	const to = new Date(toY, toM - 1, toD);
	return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}
