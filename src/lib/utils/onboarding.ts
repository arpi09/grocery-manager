import { isMarketingPath } from '$lib/marketing/routes';

/** Current onboarding tour version — bump to show the guide again for returning users. */
export const ONBOARDING_VERSION = 3;

export { ONBOARDING_STEP_COUNT } from '$lib/utils/onboarding-steps';

const VERSION_SUFFIX = 'version';
const DISMISSED_SUFFIX = 'dismissed';
const POST_ONBOARDING_SURVEY_PENDING_SUFFIX = 'post-onboarding-survey-pending';
const POST_ONBOARDING_SURVEY_DISMISSED_SUFFIX = 'post-onboarding-survey-dismissed';
const ACTIVATION_PATH_SUFFIX = 'activation-path';
const ACTIVATION_BARCODE_COUNT_SUFFIX = 'activation-barcode-count';
const ACTIVATION_RECEIPT_SUFFIX = 'activation-receipt-done';
const CELEBRATION_PENDING_SUFFIX = 'celebration-pending';
const SIGNUP_AT_SUFFIX = 'signup-at';

/** Legacy keys (pre user-scoped storage) — cleared on reset without userId. */
const LEGACY_KEYS = [
	'home-pantry-onboarding-version',
	'home-pantry-onboarding-dismissed',
	'home-pantry-activation-path',
	'home-pantry-activation-barcode-count',
	'home-pantry-activation-receipt-done',
	'home-pantry-celebration-pending',
	'home-pantry-post-onboarding-survey-pending',
	'home-pantry-post-onboarding-survey-dismissed'
] as const;

export const ONBOARDING_REPLAY_EVENT = 'home-pantry-onboarding-replay';
export const ONBOARDING_PROGRESS_EVENT = 'home-pantry-onboarding-progress';

export const ACTIVATION_BARCODE_GOAL = 5;

const EXCLUDED_PATH_PREFIXES = ['/admin', '/login', '/register'] as const;

export type ActivationPath = 'barcode' | 'receipt' | 'photo';

export interface ActivationProgress {
	path: ActivationPath | null;
	barcodeCount: number;
	barcodeGoal: number;
	receiptDone: boolean;
	inProgress: boolean;
	isComplete: boolean;
}

function storageKey(suffix: string, userId?: string | null): string {
	const base = `home-pantry-onboarding-${suffix}`;
	return userId ? `${base}:${userId}` : base;
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

export function shouldShowOnboarding(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (isActivationComplete(userId)) {
		return false;
	}

	const storedVersion = localStorage.getItem(storageKey(VERSION_SUFFIX, userId));
	if (storedVersion !== String(ONBOARDING_VERSION)) {
		return true;
	}

	return localStorage.getItem(storageKey(DISMISSED_SUFFIX, userId)) !== '1';
}

export function completeOnboarding(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(VERSION_SUFFIX, userId), String(ONBOARDING_VERSION));
	localStorage.setItem(storageKey(DISMISSED_SUFFIX, userId), '1');
	markPostOnboardingSurveyPending(userId);
}

export function markPostOnboardingSurveyPending(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	if (localStorage.getItem(storageKey(POST_ONBOARDING_SURVEY_DISMISSED_SUFFIX, userId)) === '1') {
		return;
	}

	localStorage.setItem(storageKey(POST_ONBOARDING_SURVEY_PENDING_SUFFIX, userId), '1');
}

export function shouldShowPostOnboardingSurvey(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (localStorage.getItem(storageKey(POST_ONBOARDING_SURVEY_DISMISSED_SUFFIX, userId)) === '1') {
		return false;
	}

	return localStorage.getItem(storageKey(POST_ONBOARDING_SURVEY_PENDING_SUFFIX, userId)) === '1';
}

/** Calm surfaces only — not during scan/login flows. */
export function isPostOnboardingSurveyPath(pathname: string): boolean {
	if (pathname === '/hem' || pathname === '/inkop') {
		return true;
	}
	return pathname.startsWith('/inventory/');
}

export function dismissPostOnboardingSurvey(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.removeItem(storageKey(POST_ONBOARDING_SURVEY_PENDING_SUFFIX, userId));
	localStorage.setItem(storageKey(POST_ONBOARDING_SURVEY_DISMISSED_SUFFIX, userId), '1');
}

export function clearPostOnboardingSurveyPending(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.removeItem(storageKey(POST_ONBOARDING_SURVEY_PENDING_SUFFIX, userId));
}

/** Skip or finish the tour — never show again for this version for this user on this device. */
export function dismissOnboarding(userId?: string | null): void {
	completeOnboarding(userId);
}

function clearUserOnboardingKeys(userId: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	for (const suffix of [
		VERSION_SUFFIX,
		DISMISSED_SUFFIX,
		ACTIVATION_PATH_SUFFIX,
		ACTIVATION_BARCODE_COUNT_SUFFIX,
		ACTIVATION_RECEIPT_SUFFIX,
		CELEBRATION_PENDING_SUFFIX,
		POST_ONBOARDING_SURVEY_PENDING_SUFFIX,
		POST_ONBOARDING_SURVEY_DISMISSED_SUFFIX,
		SIGNUP_AT_SUFFIX
	]) {
		localStorage.removeItem(storageKey(suffix, userId));
	}
}

export function markSignupAt(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	if (localStorage.getItem(storageKey(SIGNUP_AT_SUFFIX, userId))) {
		return;
	}

	localStorage.setItem(storageKey(SIGNUP_AT_SUFFIX, userId), String(Date.now()));
}

export function getSignupAt(userId?: string | null): number | null {
	if (typeof localStorage === 'undefined' || !userId) {
		return null;
	}

	const raw = localStorage.getItem(storageKey(SIGNUP_AT_SUFFIX, userId));
	if (!raw) {
		return null;
	}

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

export function secondsSinceSignup(userId?: string | null): number | null {
	const signupAt = getSignupAt(userId);
	if (signupAt === null) {
		return null;
	}

	return Math.max(0, Math.round((Date.now() - signupAt) / 1000));
}

export function resetOnboarding(userId?: string | null): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	if (userId) {
		clearUserOnboardingKeys(userId);
	} else {
		for (const key of LEGACY_KEYS) {
			localStorage.removeItem(key);
		}
	}

	dispatchProgress();
}

export function requestOnboardingReplay(userId?: string | null): void {
	resetOnboarding(userId);
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(ONBOARDING_REPLAY_EVENT));
	}
}

export function getActivationProgress(userId?: string | null): ActivationProgress {
	const barcodeGoal = ACTIVATION_BARCODE_GOAL;

	if (typeof localStorage === 'undefined' || !userId) {
		return {
			path: null,
			barcodeCount: 0,
			barcodeGoal,
			receiptDone: false,
			inProgress: false,
			isComplete: false
		};
	}

	const pathRaw = localStorage.getItem(storageKey(ACTIVATION_PATH_SUFFIX, userId));
	const path =
		pathRaw === 'barcode' || pathRaw === 'receipt' || pathRaw === 'photo' ? pathRaw : null;
	const receiptDone = localStorage.getItem(storageKey(ACTIVATION_RECEIPT_SUFFIX, userId)) === '1';
	const storedBarcodeCount = Number(
		localStorage.getItem(storageKey(ACTIVATION_BARCODE_COUNT_SUFFIX, userId)) ?? '0'
	);
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

export function isActivationComplete(userId?: string | null): boolean {
	return getActivationProgress(userId).isComplete;
}

export function setActivationPath(path: ActivationPath, userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ACTIVATION_PATH_SUFFIX, userId), path);
	dispatchProgress();
}

function markActivationComplete(userId?: string | null): void {
	completeOnboarding(userId);
	if (typeof localStorage !== 'undefined' && userId) {
		localStorage.setItem(storageKey(CELEBRATION_PENDING_SUFFIX, userId), '1');
	}
	dispatchProgress();
}

/** Returns true when activation just completed on this call. */
export function recordBarcodeActivation(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (isActivationComplete(userId)) {
		return false;
	}

	const next =
		Number(localStorage.getItem(storageKey(ACTIVATION_BARCODE_COUNT_SUFFIX, userId)) ?? '0') + 1;
	localStorage.setItem(storageKey(ACTIVATION_BARCODE_COUNT_SUFFIX, userId), String(next));

	if (next >= ACTIVATION_BARCODE_GOAL) {
		markActivationComplete(userId);
		return true;
	}

	dispatchProgress();
	return false;
}

/** Returns true when activation just completed on this call. */
export function recordReceiptActivation(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (isActivationComplete(userId)) {
		return true;
	}

	localStorage.setItem(storageKey(ACTIVATION_RECEIPT_SUFFIX, userId), '1');
	markActivationComplete(userId);
	return true;
}

export function shouldShowCelebration(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (!isActivationComplete(userId)) {
		return false;
	}

	return localStorage.getItem(storageKey(CELEBRATION_PENDING_SUFFIX, userId)) === '1';
}

export function clearCelebrationPending(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.removeItem(storageKey(CELEBRATION_PENDING_SUFFIX, userId));
}
