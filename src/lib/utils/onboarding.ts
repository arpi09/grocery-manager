import { isMarketingPath } from '$lib/marketing/routes';

import { markPmfSurveyEligible } from '$lib/utils/pmf-survey-storage';

import type {
	ActivationOnboardingFlags,
	ActivationSuccessItemSnapshot
} from '$lib/utils/activation-onboarding-state';

export type {
	ActivationOnboardingFlags,
	ActivationProgressMilestone,
	ActivationScreen,
	ActivationSuccessItemSnapshot,
	ActivationTelemetryStep
} from '$lib/utils/activation-onboarding-state';

export {
	deriveActivationScreen,
	getActivationProgressChecklist
} from '$lib/utils/activation-onboarding-state';

/** Current onboarding tour version — bump to show the guide again for returning users. */

export const ONBOARDING_VERSION = 7;

export { ONBOARDING_STEP_COUNT } from '$lib/utils/onboarding-steps';

const VERSION_SUFFIX = 'version';

const DISMISSED_SUFFIX = 'dismissed';

const POST_ONBOARDING_SURVEY_PENDING_SUFFIX = 'post-onboarding-survey-pending';

const POST_ONBOARDING_SURVEY_DISMISSED_SUFFIX = 'post-onboarding-survey-dismissed';

const POST_ONBOARDING_SHARE_PENDING_SUFFIX = 'post-onboarding-share-pending';

const POST_ONBOARDING_SHARE_DISMISSED_SUFFIX = 'post-onboarding-share-dismissed';

const ACTIVATION_PATH_SUFFIX = 'activation-path';

const ACTIVATION_BARCODE_COUNT_SUFFIX = 'activation-barcode-count';

const ACTIVATION_RECEIPT_SUFFIX = 'activation-receipt-done';

const ACTIVATION_FIRST_ITEM_DONE_SUFFIX = 'activation-first-item-done';

const ACTIVATION_WELCOME_SEEN_SUFFIX = 'activation-welcome-seen';

const ACTIVATION_SCAN_STARTED_SUFFIX = 'activation-scan-started';

const ACTIVATION_SCAN_DEFERRED_SUFFIX = 'activation-scan-deferred';

const ACTIVATION_FIRST_SCAN_DONE_SUFFIX = 'activation-first-scan-done';

const ACTIVATION_INVENTORY_CREATED_SUFFIX = 'activation-inventory-created';

const ACTIVATION_SUCCESS_SEEN_SUFFIX = 'activation-success-seen';

const ACTIVATION_BRAIN_SEEN_SUFFIX = 'activation-brain-seen';

const ACTIVATION_SHOPPING_SEEN_SUFFIX = 'activation-shopping-seen';

const ACTIVATION_SUCCESS_SNAPSHOT_SUFFIX = 'activation-success-snapshot';

const ACTIVATION_SHOPPING_COUNT_SUFFIX = 'activation-shopping-count';

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

export const REGISTRATION_WELCOME_DONE_EVENT = 'home-pantry-registration-welcome-done';

/** Barcode path completes after three scans (legacy activation). */

export const ACTIVATION_BARCODE_GOAL = 3;

/** Core mode: shopping list items to complete onboarding. */

export const ACTIVATION_SHOPPING_LIST_GOAL = 3;

const EXCLUDED_PATH_PREFIXES = ['/admin', '/login', '/register', '/verify-email'] as const;

export type ActivationPath = 'barcode' | 'receipt' | 'photo' | 'shopping';

export interface ActivationProgress {
	path: ActivationPath | null;

	barcodeCount: number;

	barcodeGoal: number;

	shoppingListCount: number;

	shoppingListGoal: number;

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

export function isOnboardingPrimaryPath(pathname: string): boolean {
	return pathname === '/inkop' || pathname.startsWith('/inkop/');
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

	const storedVersion = localStorage.getItem(storageKey(VERSION_SUFFIX, userId));
	const dismissed = localStorage.getItem(storageKey(DISMISSED_SUFFIX, userId)) === '1';

	// Users who dismissed v6+ stay dismissed when onboarding version bumps.
	if (dismissed && storedVersion && Number(storedVersion) >= 6) {
		return false;
	}

	if (isActivationOnboardingFlowComplete(userId)) {
		return false;
	}

	if (storedVersion !== String(ONBOARDING_VERSION)) {
		return true;
	}

	return !dismissed;
}

export function completeOnboarding(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(VERSION_SUFFIX, userId), String(ONBOARDING_VERSION));

	localStorage.setItem(storageKey(DISMISSED_SUFFIX, userId), '1');

	markPostOnboardingSurveyPending(userId);
	markPostOnboardingSharePending(userId);
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

export function markPostOnboardingSharePending(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	if (localStorage.getItem(storageKey(POST_ONBOARDING_SHARE_DISMISSED_SUFFIX, userId)) === '1') {
		return;
	}

	localStorage.setItem(storageKey(POST_ONBOARDING_SHARE_PENDING_SUFFIX, userId), '1');
}

export function shouldShowPostOnboardingShare(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (localStorage.getItem(storageKey(POST_ONBOARDING_SHARE_DISMISSED_SUFFIX, userId)) === '1') {
		return false;
	}

	return localStorage.getItem(storageKey(POST_ONBOARDING_SHARE_PENDING_SUFFIX, userId)) === '1';
}

export function dismissPostOnboardingShare(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.removeItem(storageKey(POST_ONBOARDING_SHARE_PENDING_SUFFIX, userId));
	localStorage.setItem(storageKey(POST_ONBOARDING_SHARE_DISMISSED_SUFFIX, userId), '1');
}

/** Inkop-only — do not stack partner prompts on /hem with household briefing. */
export function isPostOnboardingSharePath(pathname: string): boolean {
	return pathname === '/inkop' || pathname.startsWith('/inkop/');
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

		ACTIVATION_FIRST_ITEM_DONE_SUFFIX,

		ACTIVATION_WELCOME_SEEN_SUFFIX,

		ACTIVATION_SCAN_STARTED_SUFFIX,

		ACTIVATION_SCAN_DEFERRED_SUFFIX,

		ACTIVATION_FIRST_SCAN_DONE_SUFFIX,

		ACTIVATION_INVENTORY_CREATED_SUFFIX,

		ACTIVATION_SUCCESS_SEEN_SUFFIX,

		ACTIVATION_BRAIN_SEEN_SUFFIX,

		ACTIVATION_SHOPPING_SEEN_SUFFIX,

		ACTIVATION_SUCCESS_SNAPSHOT_SUFFIX,

		ACTIVATION_SHOPPING_COUNT_SUFFIX,

		CELEBRATION_PENDING_SUFFIX,

		POST_ONBOARDING_SURVEY_PENDING_SUFFIX,

		POST_ONBOARDING_SURVEY_DISMISSED_SUFFIX,

		POST_ONBOARDING_SHARE_PENDING_SUFFIX,

		POST_ONBOARDING_SHARE_DISMISSED_SUFFIX,

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

	const shoppingListGoal = ACTIVATION_SHOPPING_LIST_GOAL;

	if (typeof localStorage === 'undefined' || !userId) {
		return {
			path: null,

			barcodeCount: 0,

			barcodeGoal,

			shoppingListCount: 0,

			shoppingListGoal,

			receiptDone: false,

			inProgress: false,

			isComplete: false
		};
	}

	const pathRaw = localStorage.getItem(storageKey(ACTIVATION_PATH_SUFFIX, userId));

	const path =
		pathRaw === 'barcode' || pathRaw === 'receipt' || pathRaw === 'photo' || pathRaw === 'shopping'
			? pathRaw
			: null;

	const receiptDone = localStorage.getItem(storageKey(ACTIVATION_RECEIPT_SUFFIX, userId)) === '1';

	const firstItemDone =
		localStorage.getItem(storageKey(ACTIVATION_FIRST_ITEM_DONE_SUFFIX, userId)) === '1';

	const storedBarcodeCount = Number(
		localStorage.getItem(storageKey(ACTIVATION_BARCODE_COUNT_SUFFIX, userId)) ?? '0'
	);

	const storedShoppingCount = Number(
		localStorage.getItem(storageKey(ACTIVATION_SHOPPING_COUNT_SUFFIX, userId)) ?? '0'
	);

	const flags = getActivationOnboardingFlags(userId);
	const usingV7Flow =
		flags.welcomeSeen ||
		flags.scanStarted ||
		flags.firstScanDone ||
		flags.successSeen ||
		flags.brainSeen ||
		flags.shoppingSeen;

	const isComplete = usingV7Flow
		? isActivationOnboardingFlowComplete(userId)
		: receiptDone ||
			firstItemDone ||
			storedBarcodeCount >= barcodeGoal ||
			storedShoppingCount >= shoppingListGoal;

	const barcodeCount = receiptDone && isComplete ? 0 : storedBarcodeCount;

	const inProgress =
		!isComplete &&
		(path !== null ||
			storedBarcodeCount > 0 ||
			storedShoppingCount > 0 ||
			receiptDone ||
			firstItemDone);

	return {
		path,

		barcodeCount,

		barcodeGoal,

		shoppingListCount: storedShoppingCount,

		shoppingListGoal,

		receiptDone,

		inProgress,

		isComplete
	};
}

export function getActivationOnboardingFlags(userId?: string | null): ActivationOnboardingFlags {
	if (typeof localStorage === 'undefined' || !userId) {
		return emptyActivationFlags();
	}

	return {
		welcomeSeen: localStorage.getItem(storageKey(ACTIVATION_WELCOME_SEEN_SUFFIX, userId)) === '1',
		scanStarted: localStorage.getItem(storageKey(ACTIVATION_SCAN_STARTED_SUFFIX, userId)) === '1',
		scanDeferred: localStorage.getItem(storageKey(ACTIVATION_SCAN_DEFERRED_SUFFIX, userId)) === '1',
		firstScanDone:
			localStorage.getItem(storageKey(ACTIVATION_FIRST_SCAN_DONE_SUFFIX, userId)) === '1',
		inventoryCreated:
			localStorage.getItem(storageKey(ACTIVATION_INVENTORY_CREATED_SUFFIX, userId)) === '1',
		successSeen: localStorage.getItem(storageKey(ACTIVATION_SUCCESS_SEEN_SUFFIX, userId)) === '1',
		brainSeen: localStorage.getItem(storageKey(ACTIVATION_BRAIN_SEEN_SUFFIX, userId)) === '1',
		shoppingSeen:
			localStorage.getItem(storageKey(ACTIVATION_SHOPPING_SEEN_SUFFIX, userId)) === '1'
	};
}

function emptyActivationFlags(): ActivationOnboardingFlags {
	return {
		welcomeSeen: false,
		scanStarted: false,
		scanDeferred: false,
		firstScanDone: false,
		inventoryCreated: false,
		successSeen: false,
		brainSeen: false,
		shoppingSeen: false
	};
}

export function isActivationOnboardingFlowComplete(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	return localStorage.getItem(storageKey(ACTIVATION_SHOPPING_SEEN_SUFFIX, userId)) === '1';
}

export function getActivationSuccessSnapshot(
	userId?: string | null
): ActivationSuccessItemSnapshot[] {
	if (typeof localStorage === 'undefined' || !userId) {
		return [];
	}

	const raw = localStorage.getItem(storageKey(ACTIVATION_SUCCESS_SNAPSHOT_SUFFIX, userId));
	if (!raw) {
		return [];
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed
			.filter(
				(entry): entry is ActivationSuccessItemSnapshot =>
					!!entry &&
					typeof entry === 'object' &&
					'name' in entry &&
					typeof entry.name === 'string' &&
					'locationLabel' in entry &&
					typeof entry.locationLabel === 'string'
			)
			.slice(0, 3);
	} catch {
		return [];
	}
}

function saveActivationSuccessSnapshot(
	userId: string,
	items: ActivationSuccessItemSnapshot[]
): void {
	if (items.length === 0) {
		return;
	}

	localStorage.setItem(
		storageKey(ACTIVATION_SUCCESS_SNAPSHOT_SUFFIX, userId),
		JSON.stringify(items.slice(0, 3))
	);
}

export function markActivationWelcomeSeen(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ACTIVATION_WELCOME_SEEN_SUFFIX, userId), '1');
	dispatchProgress();
}

export function markActivationScanStarted(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ACTIVATION_SCAN_STARTED_SUFFIX, userId), '1');
	localStorage.removeItem(storageKey(ACTIVATION_SCAN_DEFERRED_SUFFIX, userId));
	dispatchProgress();
}

export function markActivationScanDeferred(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ACTIVATION_SCAN_DEFERRED_SUFFIX, userId), '1');
	dispatchProgress();
}

export function markActivationSuccessSeen(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ACTIVATION_SUCCESS_SEEN_SUFFIX, userId), '1');
	dispatchProgress();
}

export function markActivationBrainSeen(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ACTIVATION_BRAIN_SEEN_SUFFIX, userId), '1');
	dispatchProgress();
}

export function markActivationShoppingSeen(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ACTIVATION_SHOPPING_SEEN_SUFFIX, userId), '1');
	completeOnboarding(userId);
	dispatchProgress();
}

export function isActivationComplete(userId?: string | null): boolean {
	if (isActivationOnboardingFlowComplete(userId)) {
		return true;
	}

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

	markPmfSurveyEligible(userId);

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

/** Returns true when the first scan save was recorded on this call. */

export function recordActivationScanSave(
	userId?: string | null,
	items?: ActivationSuccessItemSnapshot[]
): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (getActivationOnboardingFlags(userId).firstScanDone) {
		return false;
	}

	localStorage.setItem(storageKey(ACTIVATION_FIRST_SCAN_DONE_SUFFIX, userId), '1');
	localStorage.setItem(storageKey(ACTIVATION_INVENTORY_CREATED_SUFFIX, userId), '1');
	localStorage.setItem(storageKey(ACTIVATION_FIRST_ITEM_DONE_SUFFIX, userId), '1');

	if (items?.length) {
		saveActivationSuccessSnapshot(userId, items);
	}

	dispatchProgress();
	return true;
}

/** Returns true when the first scan save was recorded on this call (any add path). */

export function recordFirstItemActivation(
	userId?: string | null,
	items?: ActivationSuccessItemSnapshot[]
): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (shouldShowOnboarding(userId)) {
		return recordActivationScanSave(userId, items);
	}

	if (isActivationComplete(userId)) {
		return false;
	}

	localStorage.setItem(storageKey(ACTIVATION_FIRST_ITEM_DONE_SUFFIX, userId), '1');
	markActivationComplete(userId);
	return true;
}

/** Returns true when activation just completed on this call. */

export function recordShoppingListItemActivation(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (isActivationComplete(userId)) {
		return false;
	}

	const next =
		Number(localStorage.getItem(storageKey(ACTIVATION_SHOPPING_COUNT_SUFFIX, userId)) ?? '0') + 1;

	localStorage.setItem(storageKey(ACTIVATION_SHOPPING_COUNT_SUFFIX, userId), String(next));

	if (next >= ACTIVATION_SHOPPING_LIST_GOAL) {
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
