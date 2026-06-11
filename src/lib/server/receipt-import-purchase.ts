import type { StorageLocation } from '$lib/domain/location';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import type { RecordReceiptPurchaseLineInput } from '$lib/domain/purchase-pattern';

export function parseOptionalPurchasedAt(value: string | Date | null | undefined): Date | null {
	if (!value) return null;
	const parsed = value instanceof Date ? value : new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseOptionalPriceField(value: unknown): string | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value.toFixed(2);
	}
	if (typeof value !== 'string') return null;
	const normalized = value.trim().replace(',', '.');
	if (!normalized) return null;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

export function receiptLineToPurchaseRecord(input: {
	householdId: string;
	userId: string;
	importBatchId: string;
	line: ReceiptLine;
	location: StorageLocation;
	quantity: string | null;
	unit: string | null;
	storeLabel?: string | null;
	purchasedAt?: string | Date | null;
}): RecordReceiptPurchaseLineInput {
	return {
		householdId: input.householdId,
		userId: input.userId,
		importBatchId: input.importBatchId,
		productName: input.line.name.trim(),
		location: input.location,
		quantity: input.quantity,
		unit: input.unit,
		unitPrice: parseOptionalPriceField(input.line.unitPrice),
		currency: input.line.currency?.trim().toUpperCase() || 'SEK',
		lineTotal: parseOptionalPriceField(input.line.lineTotal),
		storeLabel: input.storeLabel?.trim() || null,
		purchasedAt: parseOptionalPurchasedAt(input.purchasedAt)
	};
}
