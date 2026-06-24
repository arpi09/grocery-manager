import {
	isBrainFeedbackV1Enabled,
	isHomeRedesignV1Enabled,
	isHomeUxV2Enabled,
	isPantryUxV2Enabled,
	isPriceMemoryV1Enabled,
	isShoppingListShareEnabled,
	isShoppingUxV2Enabled
} from './feature-flags';
import { isShelfLifeEstimatesInReceiptEnabled } from './shelf-life-learning-flag';

export type LayoutClientFlagSource = 'env' | 'default';

export type LayoutClientFlagSnapshotEntry = {
	propName: string;
	envKey: string;
	effective: boolean;
	envValue: string | null;
	source: LayoutClientFlagSource;
	fallbackNote?: string;
};

function readPublicEnv(envKey: string): { envValue: string | null; source: LayoutClientFlagSource } {
	const raw = process.env[envKey];
	if (raw === undefined || raw === '') {
		return { envValue: null, source: 'default' };
	}
	return { envValue: raw, source: 'env' };
}

/** Booleans sent to the client via +layout.server.ts (read-only admin snapshot). */
export function getLayoutClientFlagSnapshot(): LayoutClientFlagSnapshotEntry[] {
	const shelfLifePublic = readPublicEnv('PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT');

	return [
		{
			propName: 'shelfLifeEstimatesInReceipt',
			envKey: 'PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT',
			effective: isShelfLifeEstimatesInReceiptEnabled(),
			envValue: shelfLifePublic.envValue,
			source: shelfLifePublic.source,
			fallbackNote: 'SHELF_LIFE_LEARNING_ENABLED when PUBLIC unset'
		},
		{
			propName: 'homeRedesignV1Enabled',
			envKey: 'HOME_REDESIGN_V1_ENABLED',
			...readPublicEnv('HOME_REDESIGN_V1_ENABLED'),
			effective: isHomeRedesignV1Enabled()
		},
		{
			propName: 'priceMemoryV1Enabled',
			envKey: 'PRICE_MEMORY_V1_ENABLED',
			...readPublicEnv('PRICE_MEMORY_V1_ENABLED'),
			effective: isPriceMemoryV1Enabled()
		},
		{
			propName: 'brainFeedbackV1Enabled',
			envKey: 'BRAIN_FEEDBACK_V1_ENABLED',
			...readPublicEnv('BRAIN_FEEDBACK_V1_ENABLED'),
			effective: isBrainFeedbackV1Enabled()
		},
		{
			propName: 'shoppingUxV2Enabled',
			envKey: 'SHOPPING_UX_V2_ENABLED',
			...readPublicEnv('SHOPPING_UX_V2_ENABLED'),
			effective: isShoppingUxV2Enabled()
		},
		{
			propName: 'pantryUxV2Enabled',
			envKey: 'PANTRY_UX_V2_ENABLED',
			...readPublicEnv('PANTRY_UX_V2_ENABLED'),
			effective: isPantryUxV2Enabled()
		},
		{
			propName: 'homeUxV2Enabled',
			envKey: 'HOME_UX_V2_ENABLED',
			...readPublicEnv('HOME_UX_V2_ENABLED'),
			effective: isHomeUxV2Enabled()
		},
		{
			propName: 'shareLinkEnabled',
			envKey: 'PUBLIC_SHOPPING_LIST_SHARE_ENABLED',
			...readPublicEnv('PUBLIC_SHOPPING_LIST_SHARE_ENABLED'),
			effective: isShoppingListShareEnabled()
		}
	];
}
