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

	for (let i = 0; i < totalLines; i++) {
		const prediction = shelfLifePredictions?.[i];
		if (!prediction?.expiresOn) {
			missing++;
			continue;
		}
		withBbf++;
		const source = prediction.expiresOnSource;
		if (isHighConfidenceSource(source)) {
			highConfidence++;
		} else if (isEstimatedSource(source)) {
			estimated++;
		} else {
			estimated++;
		}
	}

	const bbfCoveragePercent =
		totalLines > 0 ? Math.round((withBbf / totalLines) * 1000) / 10 : 0;

	return {
		totalLines,
		withBbf,
		highConfidence,
		estimated,
		missing,
		bbfCoveragePercent
	};
}
