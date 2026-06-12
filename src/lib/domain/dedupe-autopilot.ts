import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import { isItemFinished, type InventoryItem } from '$lib/domain/inventory-item';
import { normalizeInventoryItemName } from '$lib/domain/inventory-merge';
import {
	OVERSTOCK_QUANTITY_THRESHOLD,
	OVERSTOCK_ROW_THRESHOLD
} from '$lib/domain/pantry-health';
import type { ReceiptPurchaseLineRecord } from '$lib/domain/purchase-pattern';

export type DedupeWarningKind = 'overstock' | 'recent_purchase' | 'on_list';

export interface DedupeWarning {
	kind: DedupeWarningKind;
	normalizedKey: string;
	displayName: string;
}

export const RECENT_PURCHASE_DEDUPE_DAYS = 14;

export interface DedupeAutopilotContext {
	activeItems: InventoryItem[];
	recentLines: ReceiptPurchaseLineRecord[];
	listNormalizedNames: Set<string>;
	referenceDate?: Date;
}

function purchaseDate(line: ReceiptPurchaseLineRecord): Date {
	return line.purchasedAt ?? line.createdAt;
}

function itemsForKey(items: InventoryItem[], normalizedKey: string): InventoryItem[] {
	return items.filter(
		(item) => !isItemFinished(item) && normalizeInventoryItemName(item.name) === normalizedKey
	);
}

function displayNameForKey(
	normalizedKey: string,
	items: InventoryItem[],
	lines: ReceiptPurchaseLineRecord[]
): string {
	const item = items.find((entry) => normalizeInventoryItemName(entry.name) === normalizedKey);
	if (item) {
		return item.name;
	}
	const line = lines.find((entry) => entry.normalizedKey === normalizedKey);
	return line?.productName.trim() ?? normalizedKey;
}

function detectOverstockWarning(
	normalizedKey: string,
	items: InventoryItem[],
	displayName: string
): DedupeWarning | null {
	const matches = itemsForKey(items, normalizedKey);
	if (matches.length === 0) {
		return null;
	}

	let totalQty = 0;
	for (const item of matches) {
		const qty = parseNumericQuantity(item.quantity);
		if (qty !== null) {
			totalQty += qty;
		}
	}

	if (matches.length >= OVERSTOCK_ROW_THRESHOLD || totalQty >= OVERSTOCK_QUANTITY_THRESHOLD) {
		return { kind: 'overstock', normalizedKey, displayName };
	}

	return null;
}

function detectRecentPurchaseWarning(
	normalizedKey: string,
	items: InventoryItem[],
	lines: ReceiptPurchaseLineRecord[],
	referenceDate: Date
): DedupeWarning | null {
	const matches = itemsForKey(items, normalizedKey);
	if (matches.length === 0) {
		return null;
	}

	const cutoff = new Date(referenceDate);
	cutoff.setDate(cutoff.getDate() - RECENT_PURCHASE_DEDUPE_DAYS);

	const recentPurchase = lines.some(
		(line) => line.normalizedKey === normalizedKey && purchaseDate(line) >= cutoff
	);
	if (!recentPurchase) {
		return null;
	}

	return {
		kind: 'recent_purchase',
		normalizedKey,
		displayName: displayNameForKey(normalizedKey, items, lines)
	};
}

function detectOnListWarning(
	normalizedKey: string,
	listNormalizedNames: Set<string>,
	displayName: string
): DedupeWarning | null {
	if (!listNormalizedNames.has(normalizedKey)) {
		return null;
	}

	return { kind: 'on_list', normalizedKey, displayName };
}

export function detectDedupeWarningsForKey(
	normalizedKey: string,
	context: DedupeAutopilotContext
): DedupeWarning[] {
	const referenceDate = context.referenceDate ?? new Date();
	const activeItems = context.activeItems.filter((item) => !isItemFinished(item));
	const displayName = displayNameForKey(normalizedKey, activeItems, context.recentLines);
	const warnings: DedupeWarning[] = [];

	const overstock = detectOverstockWarning(normalizedKey, activeItems, displayName);
	if (overstock) {
		warnings.push(overstock);
	}

	const recentPurchase = detectRecentPurchaseWarning(
		normalizedKey,
		activeItems,
		context.recentLines,
		referenceDate
	);
	if (recentPurchase && !warnings.some((entry) => entry.kind === 'recent_purchase')) {
		warnings.push(recentPurchase);
	}

	const onList = detectOnListWarning(normalizedKey, context.listNormalizedNames, displayName);
	if (onList) {
		warnings.push(onList);
	}

	return warnings;
}

export function detectDedupeWarningsForKeys(
	normalizedKeys: string[],
	context: DedupeAutopilotContext
): Record<string, DedupeWarning[]> {
	const uniqueKeys = [...new Set(normalizedKeys.filter(Boolean))];
	const result: Record<string, DedupeWarning[]> = {};

	for (const key of uniqueKeys) {
		const warnings = detectDedupeWarningsForKey(key, context);
		if (warnings.length > 0) {
			result[key] = warnings;
		}
	}

	return result;
}
