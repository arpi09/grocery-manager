import { isMarketingPath } from '$lib/marketing/routes';

/** Current onboarding tour version — bump to show the guide again for returning users. */
export const ONBOARDING_VERSION = 1;

const VERSION_KEY = 'home-pantry-onboarding-version';
const DISMISSED_KEY = 'home-pantry-onboarding-dismissed';
const POST_ONBOARDING_SURVEY_PENDING_KEY = 'home-pantry-post-onboarding-survey-pending';
const POST_ONBOARDING_SURVEY_DISMISSED_KEY = 'home-pantry-post-onboarding-survey-dismissed';

export const ONBOARDING_REPLAY_EVENT = 'home-pantry-onboarding-replay';
export const ONBOARDING_PROGRESS_EVENT = 'home-pantry-onboarding-progress';

export const ACTIVATION_BARCODE_GOAL = 5;

const ACTIVATION_PATH_KEY = 'home-pantry-activation-path';
const ACTIVATION_BARCODE_COUNT_KEY = 'home-pantry-activation-barcode-count';
const ACTIVATION_RECEIPT_KEY = 'home-pantry-activation-receipt-done';
const CELEBRATION_PENDING_KEY = 'home-pantry-celebration-pending';

const EXCLUDED_PATH_PREFIXES = ['/admin', '/login', '/register'] as const;

export type ActivationPath = 'barcode' | 'receipt';

export interface ActivationProgress {
	path: ActivationPath | null;
	barcodeCount: number;
	barcodeGoal: number;
	receiptDone: boolean;
	inProgress: boolean;
	isComplete: boolean;
}

function dispatchProgress(): void {
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new Event(ONBOARDING_PROGRESS_EVENT));
	}
}

export function isOnboardingExcludedPath(pathname: string): boolean {
	if (isMarketingPath(pathname)) {
		return true;
	}
	return EXCLUDED_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
}

export function shouldShowOnboarding(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	if (isActivationComplete()) {
		return false;
	}

	const storedVersion = localStorage.getItem(VERSION_KEY);
	if (storedVersion !== String(ONBOARDING_VERSION)) {
		return true;
	}

	return localStorage.getItem(DISMISSED_KEY) !== '1';
}

export function completeOnboarding(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(VERSION_KEY, String(ONBOARDING_VERSION));
	localStorage.setItem(DISMISSED_KEY, '1');
	markPostOnboardingSurveyPending();
}

export function markPostOnboardingSurveyPending(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	if (localStorage.getItem(POST_ONBOARDING_SURVEY_DISMISSED_KEY) === '1') {
		return;
	}

	localStorage.setItem(POST_ONBOARDING_SURVEY_PENDING_KEY, '1');
}

export function shouldShowPostOnboardingSurvey(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	if (localStorage.getItem(POST_ONBOARDING_SURVEY_DISMISSED_KEY) === '1') {
		return false;
	}

	return localStorage.getItem(POST_ONBOARDING_SURVEY_PENDING_KEY) === '1';
}

export function dismissPostOnboardingSurvey(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.removeItem(POST_ONBOARDING_SURVEY_PENDING_KEY);
	localStorage.setItem(POST_ONBOARDING_SURVEY_DISMISSED_KEY, '1');
}

export function clearPostOnboardingSurveyPending(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.removeItem(POST_ONBOARDING_SURVEY_PENDING_KEY);
}

/** Skip or finish the tour — never show again for this version on this device. */
export function dismissOnboarding(): void {
	completeOnboarding();
}

export function resetOnboarding(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.removeItem(VERSION_KEY);
	localStorage.removeItem(DISMISSED_KEY);
	localStorage.removeItem(ACTIVATION_PATH_KEY);
	localStorage.removeItem(ACTIVATION_BARCODE_COUNT_KEY);
	localStorage.removeItem(ACTIVATION_RECEIPT_KEY);
	localStorage.removeItem(CELEBRATION_PENDING_KEY);
	localStorage.removeItem(POST_ONBOARDING_SURVEY_PENDING_KEY);
	localStorage.removeItem(POST_ONBOARDING_SURVEY_DISMISSED_KEY);
	dispatchProgress();
}

export function requestOnboardingReplay(): void {
	resetOnboarding();
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(ONBOARDING_REPLAY_EVENT));
	}
}

export function getActivationProgress(): ActivationProgress {
	const barcodeGoal = ACTIVATION_BARCODE_GOAL;

	if (typeof localStorage === 'undefined') {
		return {
			path: null,
			barcodeCount: 0,
			barcodeGoal,
			receiptDone: false,
			inProgress: false,
			isComplete: false
		};
	}

	const pathRaw = localStorage.getItem(ACTIVATION_PATH_KEY);
	const path = pathRaw === 'barcode' || pathRaw === 'receipt' ? pathRaw : null;
	const receiptDone = localStorage.getItem(ACTIVATION_RECEIPT_KEY) === '1';
	const storedBarcodeCount = Number(localStorage.getItem(ACTIVATION_BARCODE_COUNT_KEY) ?? '0');
	const isComplete = receiptDone || storedBarcodeCount >= barcodeGoal;
	const barcodeCount = receiptDone && isComplete ? 0 : storedBarcodeCount;
	const inProgress =
		!isComplete && (path !== null || storedBarcodeCount > 0 || receiptDone);

	return {
		path,
		barcodeCount,
		barcodeGoal,
		receiptDone,
		inProgress,
		isComplete
	};
}

export function isActivationComplete(): boolean {
	return getActivationProgress().isComplete;
}

export function setActivationPath(path: ActivationPath): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(ACTIVATION_PATH_KEY, path);
	dispatchProgress();
}

function markActivationComplete(): void {
	completeOnboarding();
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(CELEBRATION_PENDING_KEY, '1');
	}
	dispatchProgress();
}

/** Returns true when activation just completed on this call. */
export function recordBarcodeActivation(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	if (isActivationComplete()) {
		return false;
	}

	const next = Number(localStorage.getItem(ACTIVATION_BARCODE_COUNT_KEY) ?? '0') + 1;
	localStorage.setItem(ACTIVATION_BARCODE_COUNT_KEY, String(next));

	if (next >= ACTIVATION_BARCODE_GOAL) {
		markActivationComplete();
		return true;
	}

	dispatchProgress();
	return false;
}

/** Returns true when activation just completed on this call. */
export function recordReceiptActivation(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	if (isActivationComplete()) {
		return true;
	}

	localStorage.setItem(ACTIVATION_RECEIPT_KEY, '1');
	markActivationComplete();
	return true;
}

export function shouldShowCelebration(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	if (!isActivationComplete()) {
		return false;
	}

	return localStorage.getItem(CELEBRATION_PENDING_KEY) === '1';
}

export function clearCelebrationPending(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.removeItem(CELEBRATION_PENDING_KEY);
}
