import { isShelfLifeLearningEnabled } from './feature-flags';

export { isShelfLifeLearningEnabled, isShelfLifeLlmEnabled } from './feature-flags';

/** Client receipt UX — explicit PUBLIC_* or fallback to server learning flag. */
export function isShelfLifeEstimatesInReceiptEnabled(): boolean {
	const explicit = process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT;
	if (explicit !== undefined && explicit !== '') {
		return explicit === 'true';
	}
	return isShelfLifeLearningEnabled();
}
