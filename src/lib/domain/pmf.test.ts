import { describe, expect, it } from 'vitest';
import {
	ACTIVATION_ITEM_THRESHOLD,
	computeActivationRate,
	computeMultiMemberHouseholdRate,
	computeRetentionRate,
	computeSmartFillWeeklyRate,
	computeWeeklyScanRate,
	isUserActivated,
	medianMinutesToFirstScan
} from './pmf';

describe('pmf activation', () => {
	it('activates when item threshold is met within 24h', () => {
		expect(
			isUserActivated({
				userId: 'u1',
				registeredAt: new Date('2026-01-01T10:00:00Z'),
				itemCountWithin24h: ACTIVATION_ITEM_THRESHOLD,
				receiptParsedWithin24h: false
			})
		).toBe(true);
	});

	it('activates on receipt parsed within 24h', () => {
		expect(
			isUserActivated({
				userId: 'u1',
				registeredAt: new Date('2026-01-01T10:00:00Z'),
				itemCountWithin24h: 2,
				receiptParsedWithin24h: true
			})
		).toBe(true);
	});

	it('does not activate below thresholds', () => {
		expect(
			isUserActivated({
				userId: 'u1',
				registeredAt: new Date('2026-01-01T10:00:00Z'),
				itemCountWithin24h: ACTIVATION_ITEM_THRESHOLD - 1,
				receiptParsedWithin24h: false
			})
		).toBe(false);
	});

	it('computes activation rate across users', () => {
		const result = computeActivationRate([
			{
				userId: 'u1',
				registeredAt: new Date(),
				itemCountWithin24h: 10,
				receiptParsedWithin24h: false
			},
			{
				userId: 'u2',
				registeredAt: new Date(),
				itemCountWithin24h: 1,
				receiptParsedWithin24h: false
			}
		]);

		expect(result).toEqual({
			rate: 0.5,
			activatedUsers: 1,
			eligibleUsers: 2
		});
	});
});

describe('pmf first scan median', () => {
	it('returns null when no scans exist', () => {
		expect(
			medianMinutesToFirstScan([
				{
					userId: 'u1',
					registeredAt: new Date('2026-01-01T10:00:00Z'),
					firstScanAt: null
				}
			])
		).toBeNull();
	});

	it('computes median minutes to first scan', () => {
		const registeredAt = new Date('2026-01-01T10:00:00Z');
		expect(
			medianMinutesToFirstScan([
				{
					userId: 'u1',
					registeredAt,
					firstScanAt: new Date('2026-01-01T10:02:00Z')
				},
				{
					userId: 'u2',
					registeredAt,
					firstScanAt: new Date('2026-01-01T10:04:00Z')
				},
				{
					userId: 'u3',
					registeredAt,
					firstScanAt: new Date('2026-01-01T10:06:00Z')
				}
			])
		).toBe(4);
	});
});

describe('pmf retention and usage rates', () => {
	const now = new Date('2026-02-01T12:00:00Z');

	it('computes D7 retention for eligible users', () => {
		const result = computeRetentionRate(
			[
				{
					id: 'u1',
					createdAt: new Date('2026-01-01T12:00:00Z'),
					lastSeenAt: new Date('2026-01-10T12:00:00Z')
				},
				{
					id: 'u2',
					createdAt: new Date('2026-01-02T12:00:00Z'),
					lastSeenAt: new Date('2026-01-03T12:00:00Z')
				}
			],
			7,
			now
		);

		expect(result.eligibleUsers).toBe(2);
		expect(result.rate).toBe(0.5);
	});

	it('computes weekly scan rate among WAU', () => {
		const result = computeWeeklyScanRate(
			new Set(['u1', 'u2', 'u3']),
			new Set(['u1', 'u4'])
		);

		expect(result).toEqual({
			rate: 1 / 3,
			wauCount: 3,
			weeklyScanners: 1
		});
	});

	it('computes multi-member active household rate', () => {
		const result = computeMultiMemberHouseholdRate(
			[
				{
					householdId: 'h1',
					userId: 'u1',
					lastSeenAt: new Date('2026-01-31T12:00:00Z')
				},
				{
					householdId: 'h1',
					userId: 'u2',
					lastSeenAt: new Date('2026-01-30T12:00:00Z')
				},
				{
					householdId: 'h2',
					userId: 'u3',
					lastSeenAt: new Date('2026-01-31T12:00:00Z')
				}
			],
			now
		);

		expect(result).toEqual({
			rate: 0.5,
			activeHouseholds: 2,
			multiMemberActiveHouseholds: 1
		});
	});

	it('computes smart fill weekly rate among WAU', () => {
		const result = computeSmartFillWeeklyRate(new Set(['u1', 'u2']), new Set(['u1', 'u3']));

		expect(result).toEqual({
			rate: 0.5,
			weeklyFillUsers: 1
		});
	});
});
