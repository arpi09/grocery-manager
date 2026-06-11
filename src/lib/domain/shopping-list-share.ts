export const SHOPPING_LIST_SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Neutral i18n key stored in snapshot — never household name. */
export const SHOPPING_LIST_SHARE_TITLE_KEY = 'shoppingListShare.publicTitle';

export interface ShoppingListShareItemSnapshot {
	name: string;
	quantity: string | null;
	unit: string | null;
	checked: boolean;
}

export interface ShoppingListShareSnapshot {
	title: string;
	items: ShoppingListShareItemSnapshot[];
	snapshotAt: string;
}

export interface ShoppingListSharePreview {
	title: string;
	items: ShoppingListShareItemSnapshot[];
	snapshotAt: string;
	expiresAt: Date;
	createdAt: Date;
}
