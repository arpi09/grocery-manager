import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ACTIVATION_BARCODE_GOAL,
	ACTIVATION_SHOPPING_LIST_GOAL,
	ONBOARDING_VERSION,
	clearCelebrationPending,
	completeOnboarding,
	getActivationInviteOutcome,
	getActivationOnboardingFlags,
	getActivationProgress,
	getActivationSeedSource,
	isActivationComplete,
	isActivationOnboardingFlowComplete,
	isOnboardingExcludedPath,
	isOnboardingPrimaryPath,
	isPostOnboardingSurveyPath,
	markSignupAt,
	markActivationFillDeferred,
	markActivationFinishSeen,
	markActivationInviteSeen,
	markActivationStaplesAdded,
	markActivationWelcomeSeen,
	migrateLegacyShareState,
	recordActivationScanSave,
	recordBarcodeActivation,
	recordFirstItemActivation,
	recordReceiptActivation,
	recordShoppingListItemActivation,
	resetOnboarding,
	secondsSinceSignup,
	shouldShowCelebration,
	shouldShowOnboarding,
	shouldShowPostOnboardingSurvey,
	dismissPostOnboardingSurvey
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

	it('shows onboarding again when version changes for non-dismissed users', () => {
		storage[`home-pantry-onboarding-version:${TEST_USER_A}`] = String(ONBOARDING_VERSION - 1);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(true);
	});

	it('keeps v6 dismissed users dismissed when onboarding version bumps', () => {
		storage[`home-pantry-onboarding-version:${TEST_USER_A}`] = '6';
		storage[`home-pantry-onboarding-dismissed:${TEST_USER_A}`] = '1';
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
	});

	it('does not resurface onboarding for v7-completed users under v8', () => {
		storage[`home-pantry-onboarding-activation-shopping-seen:${TEST_USER_A}`] = '1';
		storage[`home-pantry-onboarding-version:${TEST_USER_A}`] = '7';
		storage[`home-pantry-onboarding-dismissed:${TEST_USER_A}`] = '1';
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
	});

	it('does not resurface onboarding for v7-dismissed users under v8', () => {
		storage[`home-pantry-onboarding-version:${TEST_USER_A}`] = '7';
		storage[`home-pantry-onboarding-dismissed:${TEST_USER_A}`] = '1';
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
	});

	it('re-shows onboarding for v7 mid-flow users without a version key', () => {
		storage[`home-pantry-onboarding-activation-welcome-seen:${TEST_USER_A}`] = '1';
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(true);
	});

	it('accepts legacy shopping-seen as flow completion', () => {
		expect(isActivationOnboardingFlowComplete(TEST_USER_A)).toBe(false);
		storage[`home-pantry-onboarding-activation-shopping-seen:${TEST_USER_A}`] = '1';
		expect(isActivationOnboardingFlowComplete(TEST_USER_A)).toBe(true);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
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

	it('queues post-onboarding survey directly on completion (no share prompt)', () => {
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(false);
		completeOnboarding(TEST_USER_A);
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(true);
		dismissPostOnboardingSurvey(TEST_USER_A);
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(false);
	});

	it('respects a prior survey dismissal on completion', () => {
		dismissPostOnboardingSurvey(TEST_USER_A);
		completeOnboarding(TEST_USER_A);
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(false);
	});

	it('migrates a queued v7 share prompt to a pending survey and deletes share keys', () => {
		storage[`home-pantry-onboarding-post-onboarding-share-pending:${TEST_USER_A}`] = '1';
		storage[`home-pantry-onboarding-post-onboarding-share-dismissed:${TEST_USER_A}`] = '1';

		migrateLegacyShareState(TEST_USER_A);

		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(true);
		expect(storage[`home-pantry-onboarding-post-onboarding-share-pending:${TEST_USER_A}`]).toBeUndefined();
		expect(storage[`home-pantry-onboarding-post-onboarding-share-dismissed:${TEST_USER_A}`]).toBeUndefined();
	});

	it('migration respects a prior survey dismissal', () => {
		dismissPostOnboardingSurvey(TEST_USER_A);
		storage[`home-pantry-onboarding-post-onboarding-share-pending:${TEST_USER_A}`] = '1';

		migrateLegacyShareState(TEST_USER_A);

		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(false);
		expect(storage[`home-pantry-onboarding-post-onboarding-survey-pending:${TEST_USER_A}`]).toBeUndefined();
		expect(storage[`home-pantry-onboarding-post-onboarding-share-pending:${TEST_USER_A}`]).toBeUndefined();
	});

	it('migration is a no-op without a queued share prompt', () => {
		migrateLegacyShareState(TEST_USER_A);
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(false);
	});

	it('runs the share migration lazily via shouldShowPostOnboardingSurvey', () => {
		storage[`home-pantry-onboarding-post-onboarding-share-pending:${TEST_USER_A}`] = '1';

		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(true);
		expect(storage[`home-pantry-onboarding-post-onboarding-share-pending:${TEST_USER_A}`]).toBeUndefined();
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

describe('activation flow marks (v8)', () => {
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

	it('fill deferral reuses the legacy scan-deferred key', () => {
		markActivationFillDeferred(TEST_USER_A);
		expect(storage[`home-pantry-onboarding-activation-scan-deferred:${TEST_USER_A}`]).toBe('1');
		expect(getActivationOnboardingFlags(TEST_USER_A).fillDeferred).toBe(true);
	});

	it('staples mark seeds inventory flags, first item and seed source', () => {
		expect(getActivationSeedSource(TEST_USER_A)).toBeNull();
		markActivationStaplesAdded(TEST_USER_A);

		const flags = getActivationOnboardingFlags(TEST_USER_A);
		expect(flags.staplesAdded).toBe(true);
		expect(flags.inventoryCreated).toBe(true);
		expect(getActivationSeedSource(TEST_USER_A)).toBe('staples');
		expect(storage[`home-pantry-onboarding-activation-first-item-done:${TEST_USER_A}`]).toBe('1');
	});

	it('scan save sets receipt seed source only when no source exists', () => {
		expect(recordActivationScanSave(TEST_USER_A)).toBe(true);
		expect(getActivationSeedSource(TEST_USER_A)).toBe('receipt');
		// Second save is a no-op.
		expect(recordActivationScanSave(TEST_USER_A)).toBe(false);
	});

	it('scan save keeps staples seed source when staples came first', () => {
		markActivationStaplesAdded(TEST_USER_A);
		expect(recordActivationScanSave(TEST_USER_A)).toBe(true);
		expect(getActivationSeedSource(TEST_USER_A)).toBe('staples');
	});

	it('records the invite outcome', () => {
		expect(getActivationInviteOutcome(TEST_USER_A)).toBeNull();
		markActivationInviteSeen(TEST_USER_A, 'shared');
		expect(getActivationInviteOutcome(TEST_USER_A)).toBe('shared');
		expect(getActivationOnboardingFlags(TEST_USER_A).inviteSeen).toBe(true);
	});

	it('defaults the invite outcome to skipped', () => {
		markActivationInviteSeen(TEST_USER_A);
		expect(getActivationInviteOutcome(TEST_USER_A)).toBe('skipped');
	});

	it('v8 activation completes only at the finish screen', () => {
		markActivationWelcomeSeen(TEST_USER_A);
		expect(
			recordActivationScanSave(TEST_USER_A, [{ name: 'Milk', locationLabel: 'Fridge' }])
		).toBe(true);
		expect(isActivationComplete(TEST_USER_A)).toBe(false);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(true);

		markActivationInviteSeen(TEST_USER_A, 'skipped');
		expect(isActivationComplete(TEST_USER_A)).toBe(false);

		markActivationFinishSeen(TEST_USER_A);
		expect(isActivationComplete(TEST_USER_A)).toBe(true);
		expect(isActivationOnboardingFlowComplete(TEST_USER_A)).toBe(true);
		expect(shouldShowOnboarding(TEST_USER_A)).toBe(false);
		expect(shouldShowPostOnboardingSurvey(TEST_USER_A)).toBe(true);
	});
});

describe('activation progress (legacy counters)', () => {
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

	it('completes activation after first photo item save (legacy path)', () => {
		storage[`home-pantry-onboarding-version:${TEST_USER_A}`] = '6';
		storage[`home-pantry-onboarding-dismissed:${TEST_USER_A}`] = '1';
		expect(recordFirstItemActivation(TEST_USER_A)).toBe(true);
		expect(isActivationComplete(TEST_USER_A)).toBe(true);
		expect(recordFirstItemActivation(TEST_USER_A)).toBe(false);
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
