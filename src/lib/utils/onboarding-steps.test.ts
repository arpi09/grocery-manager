import { describe, expect, it } from 'vitest';
import {
	ONBOARDING_STEP_COUNT,
	ONBOARDING_STEP_IDS,
	canGoBackOnboarding,
	getEncourageKeyForStepIndex,
	isLastOnboardingStep
} from './onboarding-steps';

describe('onboarding step flow', () => {
	it('defines five pedagogical steps in order', () => {
		expect(ONBOARDING_STEP_COUNT).toBe(5);
		expect(ONBOARDING_STEP_IDS).toEqual(['welcome', 'scan', 'expiry', 'meals', 'ready']);
	});

	it('shows encourage micro-copy from step two onward', () => {
		expect(getEncourageKeyForStepIndex(0)).toBeNull();
		expect(getEncourageKeyForStepIndex(1)).toBe('encourageStep2');
		expect(getEncourageKeyForStepIndex(4)).toBe('encourageStep5');
		expect(getEncourageKeyForStepIndex(5)).toBeNull();
	});

	it('tracks navigation boundaries', () => {
		expect(canGoBackOnboarding(0)).toBe(false);
		expect(canGoBackOnboarding(1)).toBe(true);
		expect(isLastOnboardingStep(3)).toBe(false);
		expect(isLastOnboardingStep(4)).toBe(true);
	});
});
