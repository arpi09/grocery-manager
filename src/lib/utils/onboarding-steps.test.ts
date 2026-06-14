import { describe, expect, it } from 'vitest';
import {
	ONBOARDING_STEP_COUNT,
	ONBOARDING_STEP_IDS,
	canGoBackOnboarding,
	getEncourageKeyForStepIndex,
	getOnboardingStepId,
	isLastOnboardingStep
} from './onboarding-steps';

describe('onboarding step flow', () => {
	it('defines three guided steps in order', () => {
		expect(ONBOARDING_STEP_COUNT).toBe(3);
		expect(ONBOARDING_STEP_IDS).toEqual(['welcome', 'pathGuide', 'celebrate']);
	});

	it('maps step indices to step ids', () => {
		expect(getOnboardingStepId(0)).toBe('welcome');
		expect(getOnboardingStepId(1)).toBe('pathGuide');
		expect(getOnboardingStepId(2)).toBe('celebrate');
	});

	it('shows encourage micro-copy after welcome', () => {
		expect(getEncourageKeyForStepIndex(0)).toBeNull();
		expect(getEncourageKeyForStepIndex(1)).toBe('encouragePathGuide');
		expect(getEncourageKeyForStepIndex(2)).toBe('encourageCelebrate');
		expect(getEncourageKeyForStepIndex(3)).toBeNull();
	});

	it('tracks navigation boundaries', () => {
		expect(canGoBackOnboarding(0)).toBe(false);
		expect(canGoBackOnboarding(1)).toBe(true);
		expect(canGoBackOnboarding(2)).toBe(true);
		expect(isLastOnboardingStep(0)).toBe(false);
		expect(isLastOnboardingStep(1)).toBe(false);
		expect(isLastOnboardingStep(2)).toBe(true);
	});
});
