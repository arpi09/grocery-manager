import { isPublicShelfLifeEstimatesInReceiptEnabled } from './feature-flags';

export { isShelfLifeLearningEnabled, isPublicShelfLifeEstimatesInReceiptEnabled } from './feature-flags';

/** Client receipt UX — explicit PUBLIC_* or fallback to server learning flag. */
export function isShelfLifeEstimatesInReceiptEnabled(): boolean {
	return isPublicShelfLifeEstimatesInReceiptEnabled();
}
