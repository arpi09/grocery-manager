import { describe, expect, it } from 'vitest';
import {
	ONBOARDING_STEP_COUNT,
	ONBOARDING_STEP_IDS,
	canGoBackOnboarding,
	getEncourageKeyForStepIndex,
	isLastOnboardingStep
} from './onboarding-steps';

describe('onboarding step flow', () => {
	it('defines two quick-start steps in order', () => {
		expect(ONBOARDING_STEP_COUNT).toBe(2);
		expect(ONBOARDING_STEP_IDS).toEqual(['welcome', 'ready']);
	});

	it('shows encourage micro-copy on the final step', () => {
		expect(getEncourageKeyForStepIndex(0)).toBeNull();
		expect(getEncourageKeyForStepIndex(1)).toBe('encourageStep2');
		expect(getEncourageKeyForStepIndex(2)).toBeNull();
	});

	it('tracks navigation boundaries', () => {
		expect(canGoBackOnboarding(0)).toBe(false);
		expect(canGoBackOnboarding(1)).toBe(true);
		expect(isLastOnboardingStep(0)).toBe(false);
		expect(isLastOnboardingStep(1)).toBe(true);
	});
});
