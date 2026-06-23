import { describe, expect, it } from 'vitest';
import {
	buildBrainMetricsSnapshot,
	buildBrainReceiptFunnel,
	buildCorrectionRatesBySource,
	computeTimeToReviewMinutes,
	medianMinutes,
	modelVersionToExpiresOnSource,
	parseBrainMetricsPeriodDays
} from './brain-metrics-admin';

describe('parseBrainMetricsPeriodDays', () => {
	it('accepts 7 and defaults to 30 otherwise', () => {
		expect(parseBrainMetricsPeriodDays('7')).toBe(7);
		expect(parseBrainMetricsPeriodDays(7)).toBe(7);
		expect(parseBrainMetricsPeriodDays('30')).toBe(30);
		expect(parseBrainMetricsPeriodDays(null)).toBe(7);
		expect(parseBrainMetricsPeriodDays('14')).toBe(7);
	});
});

describe('modelVersionToExpiresOnSource', () => {
	it('maps heuristic and ai model versions', () => {
		expect(modelVersionToExpiresOnSource('heuristic-v1')).toBe('heuristic');
		expect(modelVersionToExpiresOnSource('receipt-bbf-batch')).toBe('ai_inferred');
		expect(modelVersionToExpiresOnSource('none')).toBe('unknown');
	});
});

describe('buildBrainReceiptFunnel', () => {
	it('computes conversion rates', () => {
		const funnel = buildBrainReceiptFunnel({
			receipt_import_started: 10,
			receipt_uploaded: 8,
			receipt_parsed: 6,
			receipt_review_completed: 3
		});

		expect(funnel.uploadToParseRate).toBe(0.75);
		expect(funnel.parseToReviewRate).toBe(0.5);
		expect(funnel.importToReviewRate).toBe(0.3);
	});
});

describe('buildCorrectionRatesBySource', () => {
	it('merges rows and computes correction rate', () => {
		const rows = buildCorrectionRatesBySource([
			{ source: 'heuristic', corrected: 2, accepted: 8 },
			{ source: 'heuristic', corrected: 1, accepted: 1 },
			{ source: 'ai_inferred', corrected: 4, accepted: 1 }
		]);

		expect(rows).toHaveLength(2);
		const heuristic = rows.find((row) => row.source === 'heuristic');
		expect(heuristic?.total).toBe(12);
		expect(heuristic?.correctionRate).toBeCloseTo(0.25);
	});
});

describe('computeTimeToReviewMinutes', () => {
	it('pairs import_started with review_completed per user', () => {
		const userId = 'user-1';
		const started = new Date('2026-06-01T10:00:00Z');
		const completed = new Date('2026-06-01T10:05:00Z');

		const deltas = computeTimeToReviewMinutes([
			{ userId, eventType: 'receipt_import_started', createdAt: started },
			{ userId, eventType: 'receipt_review_completed', createdAt: completed }
		]);

		expect(deltas).toEqual([5]);
	});
});

describe('medianMinutes', () => {
	it('returns null for empty input', () => {
		expect(medianMinutes([])).toBeNull();
	});

	it('returns median for odd count', () => {
		expect(medianMinutes([10, 20, 30])).toBe(20);
	});
});

describe('buildBrainMetricsSnapshot', () => {
	it('assembles admin snapshot from raw counts', () => {
		const snapshot = buildBrainMetricsSnapshot(
			{
				periodStart: new Date('2026-06-01T00:00:00Z'),
				periodEnd: new Date('2026-06-08T00:00:00Z'),
				receiptParseCount: 4,
				avgBbfCoveragePercent: 80,
				aiBatchUsedCount: 2,
				receiptParsedAggregates: {
					totalParsedLines: 48,
					avgHighConfidencePercent: 55,
					avgAiFallbackPercent: 20,
					totalLowLineConfidenceCount: 3
				},
				funnelCounts: {
					receipt_import_started: 5,
					receipt_uploaded: 4,
					receipt_parsed: 4,
					receipt_review_completed: 2
				},
				quickConfirmCount: 1,
				reviewCompletedCount: 2,
				timeToReviewMinutes: [3, 9],
				brainExplanationViewed: 7,
				eatFirst: {
					eatFirstWeekViewed: 3,
					eatFirstPlanApplied: 1,
					pantryUseSoonTapped: 2
				},
				correctionBySource: [{ source: 'heuristic', corrected: 1, accepted: 3 }],
				topCorrectedProducts: [{ subjectKey: 'mjolk', productName: 'Mjölk', correctionCount: 1 }],
				schemaRetryCount: 1
			},
			7
		);

		expect(snapshot.periodDays).toBe(7);
		expect(snapshot.quickConfirmRate).toBe(0.5);
		expect(snapshot.medianTimeToReviewMinutes).toBe(6);
		expect(snapshot.funnel.importToReviewRate).toBe(0.4);
		expect(snapshot.correctionRatesBySource[0]?.correctionRate).toBeCloseTo(0.25);
	});
});
