/** Kill switch for W1 public shopping list share (create UI + API). */
export function isShoppingListShareEnabled(): boolean {
	return process.env.PUBLIC_SHOPPING_LIST_SHARE_ENABLED === 'true';
}
