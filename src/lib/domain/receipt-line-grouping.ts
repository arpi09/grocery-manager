import { addQuantities } from '$lib/domain/inventory-merge';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';

export interface GroupedReceiptLine extends ReceiptLine {
	/** Original lines merged into this row (same normalized key + location). */
	groupedFrom?: ReceiptLine[];
	/** Number of receipt rows merged (1 = not grouped). */
	groupedCount: number;
}

export interface GroupReceiptLinesResult {
	lines: GroupedReceiptLine[];
	/** How many duplicate rows were collapsed. */
	mergedAwayCount: number;
}

function receiptLineGroupKey(line: ReceiptLine): string {
	const normalized = normalizeReceiptProductName(line.name);
	return `${line.location}:${normalized}`;
}

function mergeReceiptLineQuantities(primary: ReceiptLine, extra: ReceiptLine): ReceiptLine {
	const primaryQty = primary.quantity?.trim() || '1';
	const extraQty = extra.quantity?.trim() || '1';
	const mergedQty = addQuantities(primaryQty, extraQty);
	return {
		...primary,
		quantity: mergedQty ?? primaryQty,
		unit: primary.unit ?? extra.unit ?? null
	};
}

/** Collapse receipt rows with the same normalized product name and storage location. */
export function groupReceiptLines(lines: ReceiptLine[]): GroupReceiptLinesResult {
	const groups = new Map<string, { line: ReceiptLine; sources: ReceiptLine[] }>();

	for (const line of lines) {
		const key = receiptLineGroupKey(line);
		const existing = groups.get(key);
		if (!existing) {
			groups.set(key, { line: { ...line }, sources: [line] });
			continue;
		}
		existing.sources.push(line);
		existing.line = mergeReceiptLineQuantities(existing.line, line);
	}

	const groupedLines: GroupedReceiptLine[] = [...groups.values()].map(({ line, sources }) => ({
		...line,
		groupedFrom: sources.length > 1 ? sources : undefined,
		groupedCount: sources.length
	}));

	return {
		lines: groupedLines,
		mergedAwayCount: Math.max(0, lines.length - groupedLines.length)
	};
}
