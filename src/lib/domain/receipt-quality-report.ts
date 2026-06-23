import type { ReceiptLine, ReceiptShelfLifePrediction } from './receipt-line';
import type { ExpiresOnSource } from './auto-expired';

export interface ReceiptImportQualityReport {
	totalLines: number;
	withBbf: number;
	highConfidence: number;
	estimated: number;
	missing: number;
	/** Percent 0–100 with one decimal. */
	bbfCoveragePercent: number;
	/** Share of lines with receipt_printed / household_learned / user_set BBF. */
	highConfidencePercent: number;
	/** Share of lines where BBF came from ai_inferred. */
	aiFallbackPercent: number;
	/** Lines with parser confidence below 0.5 when confidence is set. */
	lowLineConfidenceCount: number;
}

function isHighConfidenceSource(source: ExpiresOnSource | undefined): boolean {
	return source === 'user_set' || source === 'receipt_printed' || source === 'household_learned';
}

function isEstimatedSource(source: ExpiresOnSource | undefined): boolean {
	return (
		source === 'heuristic' ||
		source === 'ai_inferred' ||
		source === 'default_heuristic'
	);
}

export function buildReceiptImportQualityReport(
	lines: ReceiptLine[],
	shelfLifePredictions: (ReceiptShelfLifePrediction | null)[] | undefined
): ReceiptImportQualityReport {
	const totalLines = lines.length;
	let withBbf = 0;
	let highConfidence = 0;
	let estimated = 0;
	let missing = 0;
	let aiFallback = 0;
	let lowLineConfidenceCount = 0;

	for (let i = 0; i < totalLines; i++) {
		const line = lines[i];
		if (line.confidence != null && line.confidence < 0.5) {
			lowLineConfidenceCount++;
		}
		const prediction = shelfLifePredictions?.[i];
		if (!prediction?.expiresOn) {
			missing++;
			continue;
		}
		withBbf++;
		const source = prediction.expiresOnSource;
		if (source === 'ai_inferred') {
			aiFallback++;
		}
		if (isHighConfidenceSource(source)) {
			highConfidence++;
		} else if (isEstimatedSource(source)) {
			estimated++;
		} else {
			estimated++;
		}
	}

	const percent = (count: number) =>
		totalLines > 0 ? Math.round((count / totalLines) * 1000) / 10 : 0;

	return {
		totalLines,
		withBbf,
		highConfidence,
		estimated,
		missing,
		bbfCoveragePercent: percent(withBbf),
		highConfidencePercent: percent(highConfidence),
		aiFallbackPercent: percent(aiFallback),
		lowLineConfidenceCount
	};
}
