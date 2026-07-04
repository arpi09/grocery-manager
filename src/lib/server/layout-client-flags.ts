import {
	isBrainFeedbackV1Enabled,
	isPriceMemoryV1Enabled,
	isShoppingListShareEnabled
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
			propName: 'shareLinkEnabled',
			envKey: 'PUBLIC_SHOPPING_LIST_SHARE_ENABLED',
			...readPublicEnv('PUBLIC_SHOPPING_LIST_SHARE_ENABLED'),
			effective: isShoppingListShareEnabled()
		}
	];
}
