export interface ReceiptLine {
	name: string;
	quantity?: string;
}

export interface ReceiptParseResult {
	lines: ReceiptLine[];
}
