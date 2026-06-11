import type { StorageLocation } from './location';

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
}
