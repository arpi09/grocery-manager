import type { ReceiptLocationPrediction, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';

const LOW_CONFIDENCE_THRESHOLD = 0.4;

export interface BrainAiUsageCounts {
	shelfLifeEstimates: number;
	locationSuggestions: number;
	lowConfidence: number;
	total: number;
}

export function emptyBrainAiUsageCounts(): BrainAiUsageCounts {
	return {
		shelfLifeEstimates: 0,
		locationSuggestions: 0,
		lowConfidence: 0,
		total: 0
	};
}

function isLowConfidencePrediction(prediction: ReceiptShelfLifePrediction): boolean {
	if (prediction.confidence != null) {
		return prediction.confidence < LOW_CONFIDENCE_THRESHOLD;
	}
	return prediction.expiresOnSource === 'default_heuristic';
}

export function aggregateBrainAiUsageFromPredictions(
	shelfLifePredictions: Array<ReceiptShelfLifePrediction | null | undefined>,
	locationPredictions: Array<ReceiptLocationPrediction | null | undefined>
): BrainAiUsageCounts {
	let shelfLifeEstimates = 0;
	let locationSuggestions = 0;
	let lowConfidence = 0;

	for (const prediction of shelfLifePredictions) {
		if (!prediction?.expiresOn) continue;
		shelfLifeEstimates += 1;
		if (isLowConfidencePrediction(prediction)) lowConfidence += 1;
	}

	for (const prediction of locationPredictions) {
		if (!prediction?.location) continue;
		locationSuggestions += 1;
	}

	const total = shelfLifeEstimates + locationSuggestions;
	return { shelfLifeEstimates, locationSuggestions, lowConfidence, total };
}

export function hasBrainAiUsage(counts: BrainAiUsageCounts): boolean {
	return counts.total > 0;
}
