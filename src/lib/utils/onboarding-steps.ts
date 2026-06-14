/** Pedagogical intro steps — welcome → path guide → celebration. */

export type OnboardingStepId = 'welcome' | 'pathGuide' | 'celebrate';

export const ONBOARDING_STEP_IDS = ['welcome', 'pathGuide', 'celebrate'] as const satisfies readonly OnboardingStepId[];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_IDS.length;

/** i18n key under `onboarding.*` shown when entering a step index > 0. */
export type OnboardingEncourageKey = 'encouragePathGuide' | 'encourageCelebrate';

const ENCOURAGE_BY_STEP_INDEX: Record<number, OnboardingEncourageKey> = {
	1: 'encouragePathGuide',
	2: 'encourageCelebrate'
};

export function getEncourageKeyForStepIndex(stepIndex: number): OnboardingEncourageKey | null {
	return ENCOURAGE_BY_STEP_INDEX[stepIndex] ?? null;
}

export function isLastOnboardingStep(stepIndex: number): boolean {
	return stepIndex >= ONBOARDING_STEP_COUNT - 1;
}

export function canGoBackOnboarding(stepIndex: number): boolean {
	return stepIndex > 0;
}

export function getOnboardingStepId(stepIndex: number): OnboardingStepId {
	return ONBOARDING_STEP_IDS[stepIndex] ?? 'welcome';
}
