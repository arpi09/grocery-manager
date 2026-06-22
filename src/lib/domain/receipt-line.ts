import type { ExpiresOnSource } from './auto-expired';
import type { PredictionSource } from './learning/predictor-types';
import type { PredictionExplanation } from './learning/prediction-trust';
import type { StorageLocation } from './location';

export interface ReceiptShelfLifePrediction {
	expiresOn: string;
	typicalDays: number;
	expiresOnSource: ExpiresOnSource;
	confidence?: number;
	modelVersion: string;
	explanation?: PredictionExplanation;
}

export interface ReceiptLocationPrediction {
	location: StorageLocation;
	source: PredictionSource;
	modelVersion: string;
	explanation?: PredictionExplanation;
}

export interface ReceiptLine {
	name: string;
	/** Numeric amount for inventory (count, weight, or package size). */
	quantity?: string;
	/** Unit when known, e.g. l, kg, ml, g, st, pack. */
	unit?: string | null;
	/** Suggested storage (AI or heuristic). */
	location: StorageLocation;
	/** Unit price from receipt parse, normalized decimal string. */
	unitPrice?: string | null;
	/** Line total from receipt parse, normalized decimal string. */
	lineTotal?: string | null;
	/** ISO currency code, typically SEK. */
	currency?: string | null;
	/** Brand when visible on receipt, e.g. Arla, ICA. */
	brand?: string | null;
	/** Package size separate from purchased quantity, e.g. "500 g". */
	packageSize?: string | null;
	/** Food category hint from parse, e.g. mejeri, grönsak. */
	categoryHint?: string | null;
	/** Original lines merged into this row (same normalized key + location). */
	groupedFrom?: ReceiptLine[];
	/** Number of receipt rows merged (1 = not grouped). */
	groupedCount?: number;
}

export interface ReceiptParseResult {
	lines: ReceiptLine[];
	storeLabel?: string;
	purchasedAt?: string;
	/** How many duplicate receipt rows were collapsed before review. */
	mergedAwayCount?: number;
	shelfLifePredictions?: (ReceiptShelfLifePrediction | null)[];
	locationPredictions?: (ReceiptLocationPrediction | null)[];
}
