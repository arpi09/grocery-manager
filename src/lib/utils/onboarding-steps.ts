/** Pedagogical intro steps — keep short for ~30s time-to-value. */

export type OnboardingStepId = 'welcome' | 'ready';

export const ONBOARDING_STEP_IDS = ['welcome', 'ready'] as const satisfies readonly OnboardingStepId[];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_IDS.length;

/** i18n key under `onboarding.*` shown when entering step index > 0. */
export type OnboardingEncourageKey = 'encourageStep2';

const ENCOURAGE_BY_STEP_INDEX: Record<number, OnboardingEncourageKey> = {
	1: 'encourageStep2'
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
