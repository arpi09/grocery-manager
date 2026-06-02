/** Pedagogical intro steps — order and encourage micro-copy between steps. */

export type OnboardingStepId = 'welcome' | 'scan' | 'expiry' | 'meals' | 'ready';

export const ONBOARDING_STEP_IDS = [
	'welcome',
	'scan',
	'expiry',
	'meals',
	'ready'
] as const satisfies readonly OnboardingStepId[];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_IDS.length;

/** i18n key under `onboarding.*` shown when entering step index > 0. */
export type OnboardingEncourageKey =
	| 'encourageStep2'
	| 'encourageStep3'
	| 'encourageStep4'
	| 'encourageStep5';

const ENCOURAGE_BY_STEP_INDEX: Record<number, OnboardingEncourageKey> = {
	1: 'encourageStep2',
	2: 'encourageStep3',
	3: 'encourageStep4',
	4: 'encourageStep5'
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
