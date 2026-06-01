import type { StorageLocation } from './location';

export interface ReceiptLine {
	name: string;
	/** Numeric amount for inventory (count, weight, or package size). */
	quantity?: string;
	/** Unit when known, e.g. l, kg, ml, g, st, pack. */
	unit?: string | null;
	/** Suggested storage (AI or heuristic). */
	location: StorageLocation;
}

export interface ReceiptParseResult {
	lines: ReceiptLine[];
}
