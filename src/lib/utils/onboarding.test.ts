import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ACTIVATION_BARCODE_GOAL,
	ONBOARDING_VERSION,
	clearCelebrationPending,
	completeOnboarding,
	getActivationProgress,
	isActivationComplete,
	isOnboardingExcludedPath,
	recordBarcodeActivation,
	recordReceiptActivation,
	resetOnboarding,
	shouldShowCelebration,
	shouldShowOnboarding,
	shouldShowPostOnboardingSurvey,
	dismissPostOnboardingSurvey
} from './onboarding';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

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

	it('shows onboarding when nothing is stored', () => {
		expect(shouldShowOnboarding()).toBe(true);
	});

	it('hides onboarding after completion for the current version', () => {
		completeOnboarding();
		expect(shouldShowOnboarding()).toBe(false);
	});

	it('shows onboarding again when version changes', () => {
		completeOnboarding();
		storage['home-pantry-onboarding-version'] = String(ONBOARDING_VERSION - 1);
		expect(shouldShowOnboarding()).toBe(true);
	});

	it('reset clears stored onboarding state', () => {
		completeOnboarding();
		recordBarcodeActivation();
		resetOnboarding();
		expect(shouldShowOnboarding()).toBe(true);
		expect(getActivationProgress().barcodeCount).toBe(0);
	});

	it('queues post-onboarding survey after completion', () => {
		expect(shouldShowPostOnboardingSurvey()).toBe(false);
		completeOnboarding();
		expect(shouldShowPostOnboardingSurvey()).toBe(true);
		dismissPostOnboardingSurvey();
		expect(shouldShowPostOnboardingSurvey()).toBe(false);
	});

	it('excludes admin and auth routes', () => {
		expect(isOnboardingExcludedPath('/admin')).toBe(true);
		expect(isOnboardingExcludedPath('/admin/users')).toBe(true);
		expect(isOnboardingExcludedPath('/login')).toBe(true);
		expect(isOnboardingExcludedPath('/register')).toBe(true);
		expect(isOnboardingExcludedPath('/')).toBe(true);
		expect(isOnboardingExcludedPath('/funktioner')).toBe(true);
		expect(isOnboardingExcludedPath(APP_HOME_PATH)).toBe(false);
		expect(isOnboardingExcludedPath('/scan')).toBe(false);
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
		for (let i = 0; i < ACTIVATION_BARCODE_GOAL - 1; i++) {
			expect(recordBarcodeActivation()).toBe(false);
		}

		const progress = getActivationProgress();
		expect(progress.barcodeCount).toBe(ACTIVATION_BARCODE_GOAL - 1);
		expect(progress.inProgress).toBe(true);
		expect(isActivationComplete()).toBe(false);
	});

	it('completes activation after five barcodes', () => {
		for (let i = 0; i < ACTIVATION_BARCODE_GOAL; i++) {
			recordBarcodeActivation();
		}

		expect(isActivationComplete()).toBe(true);
		expect(getActivationProgress().isComplete).toBe(true);
		expect(shouldShowOnboarding()).toBe(false);
		expect(shouldShowCelebration()).toBe(true);

		clearCelebrationPending();
		expect(shouldShowCelebration()).toBe(false);
	});

	it('completes activation after one receipt import', () => {
		expect(recordReceiptActivation()).toBe(true);
		expect(getActivationProgress().receiptDone).toBe(true);
		expect(isActivationComplete()).toBe(true);
		expect(shouldShowCelebration()).toBe(true);
	});

	it('does not increment barcode progress after activation is complete', () => {
		recordReceiptActivation();
		clearCelebrationPending();
		recordBarcodeActivation();
		expect(getActivationProgress().barcodeCount).toBe(0);
	});
});
