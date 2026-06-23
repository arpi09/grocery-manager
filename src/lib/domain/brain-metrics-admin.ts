import type { ExpiresOnSource } from '$lib/domain/auto-expired';

export const BRAIN_METRICS_PERIOD_OPTIONS = [7, 30] as const;
export type BrainMetricsPeriodDays = (typeof BRAIN_METRICS_PERIOD_OPTIONS)[number];
export const BRAIN_METRICS_PERIOD_DAYS: BrainMetricsPeriodDays = 7;

export function parseBrainMetricsPeriodDays(
	raw: string | number | null | undefined
): BrainMetricsPeriodDays {
	const parsed = Number(raw ?? BRAIN_METRICS_PERIOD_DAYS);
	return parsed === 30 ? 30 : 7;
}

export const BRAIN_METRIC_EVENT_TYPES = [
	'receipt_import_started',
	'receipt_uploaded',
	'receipt_parsed',
	'receipt_review_completed',
	'brain_explanation_viewed',
	'eat_first_week_viewed',
	'eat_first_plan_applied',
	'pantry_use_soon_tapped',
	'openai_schema_retry'
] as const;

export type BrainMetricEventType = (typeof BRAIN_METRIC_EVENT_TYPES)[number];

export type BrainMetricExpiresOnSource = ExpiresOnSource | 'unknown';

export interface BrainReceiptFunnelCounts {
	receipt_import_started: number;
	receipt_uploaded: number;
	receipt_parsed: number;
	receipt_review_completed: number;
}

export interface BrainReceiptFunnelSnapshot {
	counts: BrainReceiptFunnelCounts;
	uploadToParseRate: number | null;
	parseToReviewRate: number | null;
	importToReviewRate: number | null;
}

export interface CorrectionRateBySource {
	source: BrainMetricExpiresOnSource;
	corrected: number;
	accepted: number;
	total: number;
	correctionRate: number | null;
}

export interface TopCorrectedProduct {
	subjectKey: string;
	productName: string | null;
	correctionCount: number;
}

export interface BrainEatFirstCounts {
	eatFirstWeekViewed: number;
	eatFirstPlanApplied: number;
	pantryUseSoonTapped: number;
}

export interface BrainReceiptParsedAggregates {
	totalParsedLines: number;
	avgHighConfidencePercent: number;
	avgAiFallbackPercent: number;
	totalLowLineConfidenceCount: number;
}

export interface BrainMetricsRawCounts {
	periodStart: Date;
	periodEnd: Date;
	receiptParseCount: number;
	avgBbfCoveragePercent: number;
	aiBatchUsedCount: number;
	receiptParsedAggregates: BrainReceiptParsedAggregates;
	funnelCounts: BrainReceiptFunnelCounts;
	quickConfirmCount: number;
	reviewCompletedCount: number;
	timeToReviewMinutes: number[];
	brainExplanationViewed: number;
	eatFirst: BrainEatFirstCounts;
	correctionBySource: Array<{
		source: BrainMetricExpiresOnSource;
		corrected: number;
		accepted: number;
	}>;
	topCorrectedProducts: TopCorrectedProduct[];
	schemaRetryCount: number;
}

export interface BrainMetricsSnapshot extends BrainMetricsRawCounts {
	periodDays: number;
	funnel: BrainReceiptFunnelSnapshot;
	quickConfirmRate: number | null;
	correctionRatesBySource: CorrectionRateBySource[];
	medianTimeToReviewMinutes: number | null;
}

export function emptyBrainReceiptFunnelCounts(): BrainReceiptFunnelCounts {
	return {
		receipt_import_started: 0,
		receipt_uploaded: 0,
		receipt_parsed: 0,
		receipt_review_completed: 0
	};
}

export function emptyBrainMetricEventCounts(): Record<BrainMetricEventType, number> {
	return {
		receipt_import_started: 0,
		receipt_uploaded: 0,
		receipt_parsed: 0,
		receipt_review_completed: 0,
		brain_explanation_viewed: 0,
		eat_first_week_viewed: 0,
		eat_first_plan_applied: 0,
		pantry_use_soon_tapped: 0,
		openai_schema_retry: 0
	};
}

export function modelVersionToExpiresOnSource(modelVersion: string): BrainMetricExpiresOnSource {
	const value = modelVersion.trim().toLowerCase();
	if (!value || value === 'none') return 'unknown';
	if (value.includes('household')) return 'household_learned';
	if (value.includes('ai') || value.includes('bbf') || value.includes('llm') || value.includes('inferred')) {
		return 'ai_inferred';
	}
	if (value.includes('receipt') || value.includes('printed')) return 'receipt_printed';
	if (value.includes('default')) return 'default_heuristic';
	if (value.includes('heuristic')) return 'heuristic';
	if (value.includes('user')) return 'user_set';
	return 'unknown';
}

function funnelRate(numerator: number, denominator: number): number | null {
	return denominator > 0 ? numerator / denominator : null;
}

export function buildBrainReceiptFunnel(counts: BrainReceiptFunnelCounts): BrainReceiptFunnelSnapshot {
	return {
		counts,
		uploadToParseRate: funnelRate(counts.receipt_parsed, counts.receipt_uploaded),
		parseToReviewRate: funnelRate(counts.receipt_review_completed, counts.receipt_parsed),
		importToReviewRate: funnelRate(counts.receipt_review_completed, counts.receipt_import_started)
	};
}

export function buildCorrectionRatesBySource(
	rows: Array<{ source: BrainMetricExpiresOnSource; corrected: number; accepted: number }>
): CorrectionRateBySource[] {
	const merged = new Map<BrainMetricExpiresOnSource, { corrected: number; accepted: number }>();

	for (const row of rows) {
		const current = merged.get(row.source) ?? { corrected: 0, accepted: 0 };
		current.corrected += row.corrected;
		current.accepted += row.accepted;
		merged.set(row.source, current);
	}

	return [...merged.entries()]
		.map(([source, counts]) => {
			const total = counts.corrected + counts.accepted;
			return {
				source,
				corrected: counts.corrected,
				accepted: counts.accepted,
				total,
				correctionRate: total > 0 ? counts.corrected / total : null
			};
		})
		.sort((a, b) => b.total - a.total);
}

export function medianMinutes(values: number[]): number | null {
	if (values.length === 0) return null;

	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 10) / 10;
	}
	return Math.round(sorted[mid]! * 10) / 10;
}

export function computeTimeToReviewMinutes(
	events: Array<{ userId: string; eventType: string; createdAt: Date }>
): number[] {
	const byUser = new Map<string, Array<{ type: string; at: number }>>();

	for (const event of events) {
		const list = byUser.get(event.userId) ?? [];
		list.push({ type: event.eventType, at: event.createdAt.getTime() });
		byUser.set(event.userId, list);
	}

	const deltas: number[] = [];
	for (const list of byUser.values()) {
		list.sort((a, b) => a.at - b.at);
		let lastImportAt: number | null = null;
		for (const entry of list) {
			if (entry.type === 'receipt_import_started') {
				lastImportAt = entry.at;
			} else if (entry.type === 'receipt_review_completed' && lastImportAt != null) {
				const minutes = (entry.at - lastImportAt) / 60_000;
				if (minutes >= 0) deltas.push(minutes);
				lastImportAt = null;
			}
		}
	}

	return deltas;
}

export function buildBrainMetricsSnapshot(
	raw: BrainMetricsRawCounts,
	periodDays: number
): BrainMetricsSnapshot {
	return {
		...raw,
		periodDays,
		funnel: buildBrainReceiptFunnel(raw.funnelCounts),
		quickConfirmRate:
			raw.reviewCompletedCount > 0 ? raw.quickConfirmCount / raw.reviewCompletedCount : null,
		correctionRatesBySource: buildCorrectionRatesBySource(raw.correctionBySource),
		medianTimeToReviewMinutes: medianMinutes(raw.timeToReviewMinutes)
	};
}
