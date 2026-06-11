import { describe, expect, it } from 'vitest';
import {
	ACTIVATION_ITEM_THRESHOLD,
	buildMetricStatus,
	buildWeeklyReview,
	computeActivationRate,
	computeMetricDelta,
	computeMultiMemberHouseholdRate,
	computeRetentionRate,
	computeInviteRate,
	computeReceiptRate,
	computeSmartFillWeeklyRate,
	computeWeeklyRitualRate,
	computeWeeklyScanRate,
	computeWrappedRate,
	isTrackedMetricOnTarget,
	isUserActivated,
	medianMinutesToFirstScan,
	PMF_TARGETS,
	type PmfMetricSnapshot
} from './pmf';

function emptySnapshot(overrides: Partial<PmfMetricSnapshot> = {}): PmfMetricSnapshot {
	return {
		activationRate: 0,
		activatedUsers: 0,
		eligibleUsers: 0,
		medianTimeToFirstScanMinutes: null,
		weeklyScanRate: 0,
		wauCount: 0,
		weeklyScanners: 0,
		d7Retention: 0,
		d7EligibleUsers: 0,
		d30Retention: 0,
		d30EligibleUsers: 0,
		multiMemberHouseholdRate: 0,
		activeHouseholds: 0,
		multiMemberActiveHouseholds: 0,
		smartFillWeeklyRate: 0,
		weeklyFillUsers: 0,
		weeklyRitualRate: 0,
		weeklyRitualUsers: 0,
		wrappedRate: 0,
		mauCount: 0,
		wrappedViewers: 0,
		receiptRate: 0,
		receiptUsers: 0,
		inviteRate: 0,
		newHouseholds: 0,
		multiMemberNewHouseholds: 0,
		eventCounts: {
			scan_completed: 0,
			receipt_import_started: 0,
			receipt_uploaded: 0,
			receipt_parsed: 0,
			receipt_review_completed: 0,
			photo_round_parsed: 0,
			fill_suggestions_added: 0
		},
		...overrides
	};
}

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

	it('computes weekly ritual rate among WAU', () => {
		const result = computeWeeklyRitualRate(new Set(['u1', 'u2']), new Set(['u2', 'u3']));

		expect(result).toEqual({
			rate: 0.5,
			weeklyRitualUsers: 1
		});
	});

	it('computes wrapped rate among MAU', () => {
		const result = computeWrappedRate(new Set(['u1', 'u2', 'u3']), new Set(['u1', 'u4']));

		expect(result).toEqual({
			rate: 1 / 3,
			mauCount: 3,
			wrappedViewers: 1
		});
	});

	it('computes receipt rate among activated users', () => {
		const result = computeReceiptRate(new Set(['u1', 'u2']), new Set(['u1', 'u3']));

		expect(result).toEqual({
			rate: 0.5,
			receiptUsers: 1
		});
	});

	it('computes invite rate for new households', () => {
		const result = computeInviteRate([1, 2, 1]);

		expect(result).toEqual({
			rate: 1 / 3,
			newHouseholds: 3,
			multiMemberNewHouseholds: 1
		});
	});
});

describe('pmf weekly review', () => {
	it('flags metrics below PMF targets', () => {
		expect(isTrackedMetricOnTarget('activationRate', PMF_TARGETS.activationRate)).toBe(true);
		expect(isTrackedMetricOnTarget('activationRate', PMF_TARGETS.activationRate - 0.01)).toBe(
			false
		);
		expect(
			isTrackedMetricOnTarget(
				'medianTimeToFirstScanMinutes',
				PMF_TARGETS.medianTimeToFirstScanMinutes
			)
		).toBe(true);
		expect(
			isTrackedMetricOnTarget(
				'medianTimeToFirstScanMinutes',
				PMF_TARGETS.medianTimeToFirstScanMinutes + 1
			)
		).toBe(false);
		expect(isTrackedMetricOnTarget('medianTimeToFirstScanMinutes', null)).toBe(false);
	});

	it('computes week-over-week deltas with direction', () => {
		const activationUp = computeMetricDelta('activationRate', 0.5, 0.4);
		expect(activationUp.deltaDirection).toBe('up');
		expect(activationUp.delta).toBeCloseTo(0.1);

		const activationDown = computeMetricDelta('activationRate', 0.3, 0.4);
		expect(activationDown.deltaDirection).toBe('down');
		expect(activationDown.delta).toBeCloseTo(-0.1);

		expect(computeMetricDelta('medianTimeToFirstScanMinutes', 2, 5)).toEqual({
			delta: -3,
			deltaDirection: 'up'
		});
		expect(computeMetricDelta('medianTimeToFirstScanMinutes', null, 5)).toEqual({
			delta: null,
			deltaDirection: 'unknown'
		});
	});

	it('builds weekly review with below-target summary', () => {
		const current = emptySnapshot({
			activationRate: 0.5,
			d7Retention: 0.1,
			d30Retention: 0.2,
			medianTimeToFirstScanMinutes: 2
		});
		const previous = emptySnapshot({
			activationRate: 0.45,
			d7Retention: 0.12,
			d30Retention: 0.18,
			medianTimeToFirstScanMinutes: 4
		});
		const currentWeekEnd = new Date('2026-05-30T12:00:00Z');
		const previousWeekEnd = new Date('2026-05-23T12:00:00Z');

		const review = buildWeeklyReview(current, previous, currentWeekEnd, previousWeekEnd);

		expect(review.onTargetCount).toBe(3);
		expect(review.belowTarget.map((metric) => metric.key)).toEqual([
			'weeklyScanRate',
			'd7Retention',
			'multiMemberHouseholdRate',
			'smartFillWeeklyRate',
			'weeklyRitualRate',
			'wrappedRate',
			'receiptRate',
			'inviteRate'
		]);
		expect(review.totalTracked).toBe(11);
		expect(buildMetricStatus('activationRate', current, previous).deltaDirection).toBe('up');
	});
});
