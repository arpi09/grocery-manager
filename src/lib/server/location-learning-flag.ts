import { isLocationLearningEnabled } from './feature-flags';

export { isLocationLearningEnabled } from './feature-flags';

/** Client receipt UX — tied to server learning flag until PUBLIC_* env is wired. */
export function isLocationPredictionsInReceiptEnabled(): boolean {
	return isLocationLearningEnabled();
}
