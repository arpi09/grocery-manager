import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ACTIVATION_BARCODE_GOAL,
	ACTIVATION_SHOPPING_LIST_GOAL,
	ONBOARDING_VERSION,
	clearCelebrationPending,
	completeOnboarding,
	getActivationProgress,
	isActivationComplete,
	isOnboardingExcludedPath,
	isOnboardingPrimaryPath,
	isPostOnboardingSurveyPath,
	isPostOnboardingSharePath,
	markSignupAt,
	recordBarcodeActivation,
	recordReceiptActivation,
	recordShoppingListItemActivation,
	resetOnboarding,
	secondsSinceSignup,
	shouldShowCelebration,
	shouldShowOnboarding,
	shouldShowPostOnboardingSurvey,
	dismissPostOnboardingSurvey,
	shouldShowPostOnboardingShare,
	dismissPostOnboardingShare
} from './onboarding';
import { POST_REGISTER_SCAN_PATH } from '../navigation/post-register';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

const TEST_USER_A = 'user-a';
const TEST_USER_B = 'user-b';

describe('onboarding helpers', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows onboarding when nothing is stored for a user', () => {
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(true);
	});

	it('requires userId to evaluate onboarding visibility', () => {
		expect(shouldShowOnboarding()).toBe(false);
		expect(shouldShowOnboarding(null)).toBe(false);
	});

	it('hides onboarding after completion for the current version', () => {
		completeOnboarding(TEST_USER_A);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
	});

	it('shows onboarding again when version changes', () => {
		completeOnboarding(TEST_USER_A);
		storage[`home-pantry-onboarding-version:${TEST_USER_A}`] = String(ONBOARDING_VERSION - 1);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(true);
	});

	it('keeps onboarding state scoped per user on the same device', () => {
		completeOnboarding(TEST_USER_A);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
		expect(shouldShowOnboarding(TEST_USER_B)).toBe(true);
	});

	it('reset clears stored onboarding state for one user', () => {
		completeOnboarding(TEST_USER_A);
		recordBarcodeActivation(TEST_USER_A);
		resetOnboarding(TEST_USER_A);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(true);
		expect(getActivationProgress(TEST_USER_A).barcodeCount).toBe(0);
	});

	it('queues post-onboarding survey after completion', () => {
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(false);
		completeOnboarding(TEST_USER_A);
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(true);
		dismissPostOnboardingSurvey(TEST_USER_A);
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(false);
	});

	it('queues post-onboarding share prompt after completion', () => {
		expect(shouldShowPostOnboardingShare(TEST_USER_A)).toBe(false);
		completeOnboarding(TEST_USER_A);
		expect(shouldShowPostOnboardingShare(TEST_USER_A)).toBe(true);
		dismissPostOnboardingShare(TEST_USER_A);
		expect(shouldShowPostOnboardingShare(TEST_USER_A)).toBe(false);
	});

	it('limits post-onboarding survey to calm app surfaces', () => {
		expect(isPostOnboardingSurveyPath('/hem')).toBe(true);
		expect(isPostOnboardingSurveyPath('/inkop')).toBe(true);
		expect(isPostOnboardingSurveyPath('/inventory/fridge')).toBe(true);
		expect(isPostOnboardingSurveyPath('/scan')).toBe(false);
		expect(isPostOnboardingSurveyPath('/scan?mode=barcode')).toBe(false);
	});

	it('uses inkop as the primary onboarding surface', () => {
		expect(isOnboardingPrimaryPath('/inkop')).toBe(true);
		expect(isOnboardingPrimaryPath('/hem')).toBe(false);
	});

	it('limits post-onboarding share prompt to inkop only', () => {
		expect(isPostOnboardingSharePath('/inkop')).toBe(true);
		expect(isPostOnboardingSharePath('/hem')).toBe(false);
		expect(isPostOnboardingSharePath('/inventory/fridge')).toBe(false);
	});

	it('excludes admin and auth routes', () => {
		expect(isOnboardingExcludedPath('/admin')).toBe(true);
		expect(isOnboardingExcludedPath('/admin/users')).toBe(true);
		expect(isOnboardingExcludedPath('/login')).toBe(true);
		expect(isOnboardingExcludedPath('/register')).toBe(true);
		expect(isOnboardingExcludedPath('/verify-email')).toBe(true);
		expect(isOnboardingExcludedPath('/')).toBe(true);
		expect(isOnboardingExcludedPath('/funktioner')).toBe(true);
		expect(isOnboardingExcludedPath(APP_HOME_PATH)).toBe(false);
		expect(isOnboardingExcludedPath('/scan')).toBe(false);
	});

	it('auto-completes onboarding for fresh-account fast start', () => {
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(true);
		markSignupAt(TEST_USER_A);
		completeOnboarding(TEST_USER_A);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
		expect(secondsSinceSignup(TEST_USER_A)).toBeGreaterThanOrEqual(0);
	});

	it('routes new registrations to verify-email', () => {
		expect(POST_REGISTER_SCAN_PATH).toBe('/verify-email');
	});
});

describe('activation progress', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('tracks barcode scans toward the goal', () => {
		expect(ACTIVATION_BARCODE_GOAL).toBe(3);

		if (ACTIVATION_BARCODE_GOAL > 1) {
			for (let i = 0; i < ACTIVATION_BARCODE_GOAL - 1; i++) {
				expect(recordBarcodeActivation(TEST_USER_A)).toBe(false);
			}

			const progress = getActivationProgress(TEST_USER_A);
			expect(progress.barcodeCount).toBe(ACTIVATION_BARCODE_GOAL - 1);
			expect(progress.inProgress).toBe(true);
			expect(isActivationComplete(TEST_USER_A)).toBe(false);
			return;
		}

		expect(recordBarcodeActivation(TEST_USER_A)).toBe(true);
		const progress = getActivationProgress(TEST_USER_A);
		expect(progress.barcodeCount).toBe(1);
		expect(progress.inProgress).toBe(false);
		expect(isActivationComplete(TEST_USER_A)).toBe(true);
	});

	it('completes activation after three shopping list items', () => {
		expect(ACTIVATION_SHOPPING_LIST_GOAL).toBe(3);
		expect(recordShoppingListItemActivation(TEST_USER_A)).toBe(false);
		expect(recordShoppingListItemActivation(TEST_USER_A)).toBe(false);
		expect(recordShoppingListItemActivation(TEST_USER_A)).toBe(true);

		expect(isActivationComplete(TEST_USER_A)).toBe(true);
		expect(getActivationProgress(TEST_USER_A).shoppingListCount).toBe(3);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
		expect(shouldShowCelebration(TEST_USER_A)).toBe(true);
	});

	it('completes activation after three barcodes', () => {
		expect(recordBarcodeActivation(TEST_USER_A)).toBe(false);
		expect(recordBarcodeActivation(TEST_USER_A)).toBe(false);
		expect(recordBarcodeActivation(TEST_USER_A)).toBe(true);

		expect(isActivationComplete(TEST_USER_A)).toBe(true);
		expect(getActivationProgress(TEST_USER_A).isComplete).toBe(true);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
		expect(shouldShowCelebration(TEST_USER_A)).toBe(true);

		clearCelebrationPending(TEST_USER_A);
		expect(shouldShowCelebration(TEST_USER_A)).toBe(false);
	});

	it('completes activation after one receipt import', () => {
		expect(recordReceiptActivation(TEST_USER_A)).toBe(true);
		expect(getActivationProgress(TEST_USER_A).receiptDone).toBe(true);
		expect(isActivationComplete(TEST_USER_A)).toBe(true);
		expect(shouldShowCelebration(TEST_USER_A)).toBe(true);
	});

	it('does not increment barcode progress after activation is complete', () => {
		recordReceiptActivation(TEST_USER_A);
		clearCelebrationPending(TEST_USER_A);
		recordBarcodeActivation(TEST_USER_A);
		expect(getActivationProgress(TEST_USER_A).barcodeCount).toBe(0);
	});

	it('isolates activation progress between users', () => {
		recordBarcodeActivation(TEST_USER_A);
		expect(getActivationProgress(TEST_USER_A).barcodeCount).toBe(1);
		expect(getActivationProgress(TEST_USER_B).barcodeCount).toBe(0);
	});
});
