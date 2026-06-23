/** Lightweight Brain v2 observability — structured console logs for admin review. */
export interface BrainMetricsSnapshot {
	receiptParseLineCount?: number;
	bbfCoveragePercent?: number;
	bbfMissing?: number;
	aiBatchUsed?: boolean;
	source?: string;
}

export function logBrainMetrics(event: string, metrics: BrainMetricsSnapshot): void {
	console.info('[brain-metrics]', JSON.stringify({ event, at: new Date().toISOString(), ...metrics }));
}

export function summarizeReceiptParseMetrics(metadata: {
	lineCount?: number;
	bbfCoveragePercent?: number;
	bbfMissing?: number;
}): BrainMetricsSnapshot {
	return {
		receiptParseLineCount: metadata.lineCount,
		bbfCoveragePercent: metadata.bbfCoveragePercent,
		bbfMissing: metadata.bbfMissing,
		source: 'receipt_parse'
	};
}
