export type HomeState = 'cold' | 'lista_ready' | 'expiry' | 'steady';

export interface DeriveHomeStateInput {
	totalItems: number;
	expiringCount: number;
	shoppingListCount: number;
}

/** Home narrative state for `/hem` — cold pantry vs engaged briefing modes. */
export function deriveHomeState(input: DeriveHomeStateInput): HomeState {
	const { totalItems, expiringCount, shoppingListCount } = input;
	if (totalItems === 0) return 'cold';
	if (expiringCount > 0) return 'expiry';
	if (shoppingListCount > 0) return 'lista_ready';
	return 'steady';
}

export const HOME_RECOMMENDS_MAX_ROWS = 2;
