/** Lightweight Brain v2 observability — structured console logs for admin review. */

let schemaRetryLogger: ((detail: string) => void) | null = null;

export function registerBrainSchemaRetryLogger(logger: (detail: string) => void): void {
	schemaRetryLogger = logger;
}

export function logBrainSchemaRetry(feature: string, detail: string): void {
	logBrainMetrics('openai_schema_retry', { source: feature, promptVersion: detail.slice(0, 200) });
	schemaRetryLogger?.(detail);
}

export interface BrainMetricsSnapshot {
	receiptParseLineCount?: number;
	bbfCoveragePercent?: number;
	bbfMissing?: number;
	highConfidencePercent?: number;
	aiFallbackPercent?: number;
	lowLineConfidenceCount?: number;
	aiBatchUsed?: boolean;
	promptVersion?: string;
	inputTokenEstimate?: number;
	source?: string;
	wasGptInvoked?: boolean;
	inferPath?: 'receipt_batch' | 'line_infer' | 'single_llm' | 'heuristic';
}

export function logBrainMetrics(event: string, metrics: BrainMetricsSnapshot): void {
	console.info('[brain-metrics]', JSON.stringify({ event, at: new Date().toISOString(), ...metrics }));
}

export function summarizeReceiptParseMetrics(metadata: {
	lineCount?: number;
	bbfCoveragePercent?: number;
	bbfMissing?: number;
	highConfidencePercent?: number;
	aiFallbackPercent?: number;
	lowLineConfidenceCount?: number;
	aiBatchUsed?: boolean;
	promptVersion?: string;
}): BrainMetricsSnapshot {
	return {
		receiptParseLineCount: metadata.lineCount,
		bbfCoveragePercent: metadata.bbfCoveragePercent,
		bbfMissing: metadata.bbfMissing,
		highConfidencePercent: metadata.highConfidencePercent,
		aiFallbackPercent: metadata.aiFallbackPercent,
		lowLineConfidenceCount: metadata.lowLineConfidenceCount,
		aiBatchUsed: metadata.aiBatchUsed,
		promptVersion: metadata.promptVersion,
		source: 'receipt_parse'
	};
}
