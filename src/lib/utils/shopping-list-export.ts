export interface ShoppingListExportItem {
	name: string;
	quantity?: string | null;
	unit?: string | null;
	checked?: boolean;
}

export type ShoppingListExportFormat = 'bring' | 'anylist' | 'ourgroceries';

/** One line in Bring-compatible plain-text format (qty/unit optional). */
export function formatShoppingListExportLine(
	item: Pick<ShoppingListExportItem, 'name' | 'quantity' | 'unit'>
): string {
	if (item.quantity && item.unit) return `${item.quantity} ${item.unit} ${item.name}`;
	if (item.quantity) return `${item.quantity} ${item.name}`;
	return item.name;
}

/**
 * AnyList paste import: one item per line (help.anylist.com/articles/paste-items/).
 * Quantity is appended in parentheses when present so categorisation still works.
 */
export function formatAnyListExportLine(
	item: Pick<ShoppingListExportItem, 'name' | 'quantity' | 'unit'>
): string {
	const name = item.name.trim();
	const quantity = item.quantity?.trim();
	if (!quantity) return name;
	const unit = item.unit?.trim();
	const qtyLabel = unit ? `${quantity} ${unit}` : quantity;
	return `${name} (${qtyLabel})`;
}

/**
 * OurGroceries plain-text import: one item per line (ourgroceries.com/user-guide).
 * Same shape as AnyList for copy-paste compatibility.
 */
export function formatOurGroceriesExportLine(
	item: Pick<ShoppingListExportItem, 'name' | 'quantity' | 'unit'>
): string {
	return formatAnyListExportLine(item);
}

const EXPORT_LINE_FORMATTERS: Record<
	ShoppingListExportFormat,
	(item: Pick<ShoppingListExportItem, 'name' | 'quantity' | 'unit'>) => string
> = {
	bring: formatShoppingListExportLine,
	anylist: formatAnyListExportLine,
	ourgroceries: formatOurGroceriesExportLine
};

/** Unchecked items only, one per line — paste into Bring! or similar list apps. */
export function formatShoppingListExport(items: ShoppingListExportItem[]): string {
	return formatShoppingListExportByFormat(items, 'bring');
}

/** Unchecked items formatted for a specific list-app import target. */
export function formatShoppingListExportByFormat(
	items: ShoppingListExportItem[],
	format: ShoppingListExportFormat
): string {
	const formatLine = EXPORT_LINE_FORMATTERS[format];
	return items
		.filter((item) => !item.checked)
		.map(formatLine)
		.join('\n');
}

/** Appends a localized footer line (e.g. Skaffu register link) after exported list items. */
export function appendShoppingListExportFooter(itemsText: string, footerLine: string): string {
	const body = itemsText.trim();
	const footer = footerLine.trim();
	if (!body) {
		return body;
	}
	if (!footer) {
		return body;
	}
	return `${body}\n\n${footer}`;
}
