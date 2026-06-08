export type ShoppingToPantryMode = 'always' | 'ask' | 'never';

export const SHOPPING_TO_PANTRY_MODES: ShoppingToPantryMode[] = ['ask', 'always', 'never'];

export const DEFAULT_SHOPPING_TO_PANTRY_MODE: ShoppingToPantryMode = 'ask';

export function normalizeShoppingToPantryMode(value: unknown): ShoppingToPantryMode {
	if (value === 'always' || value === 'ask' || value === 'never') {
		return value;
	}
	return DEFAULT_SHOPPING_TO_PANTRY_MODE;
}
