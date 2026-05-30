export interface ShoppingListExportItem {
	name: string;
	quantity?: string | null;
	unit?: string | null;
	checked?: boolean;
}

/** One line in Bring-compatible plain-text format (qty/unit optional). */
export function formatShoppingListExportLine(
	item: Pick<ShoppingListExportItem, 'name' | 'quantity' | 'unit'>
): string {
	if (item.quantity && item.unit) return `${item.quantity} ${item.unit} ${item.name}`;
	if (item.quantity) return `${item.quantity} ${item.name}`;
	return item.name;
}

/** Unchecked items only, one per line — paste into Bring! or similar list apps. */
export function formatShoppingListExport(items: ShoppingListExportItem[]): string {
	return items
		.filter((item) => !item.checked)
		.map(formatShoppingListExportLine)
		.join('\n');
}
