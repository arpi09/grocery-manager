import type { ExpiresOnSource } from './auto-expired';
import type { PredictionSource } from './learning/predictor-types';
import type { PredictionExplanation } from './learning/prediction-trust';
import type { StorageLocation } from './location';

export interface ReceiptShelfLifePrediction {
	expiresOn: string;
	typicalDays: number;
	expiresOnSource: ExpiresOnSource;
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
}

export interface ReceiptParseResult {
	lines: ReceiptLine[];
	storeLabel?: string;
	purchasedAt?: string;
}
