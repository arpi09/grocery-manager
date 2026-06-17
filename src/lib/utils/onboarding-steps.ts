/** Activation onboarding screens — state-driven, not a step carousel. */

export type ActivationScreenId = 'welcome' | 'scan' | 'success' | 'brain' | 'shopping';

export const ACTIVATION_SCREEN_IDS = [
	'welcome',
	'scan',
	'success',
	'brain',
	'shopping'
] as const satisfies readonly ActivationScreenId[];

export const ACTIVATION_SCREEN_COUNT = ACTIVATION_SCREEN_IDS.length;

/** @deprecated Legacy export — activation flow uses ACTIVATION_SCREEN_COUNT. */
export const ONBOARDING_STEP_COUNT = ACTIVATION_SCREEN_COUNT;

export type ActivationProgressKey =
	| 'welcome'
	| 'firstScan'
	| 'pantryCreated'
	| 'brain'
	| 'shopping';

export const ACTIVATION_PROGRESS_KEYS = [
	'welcome',
	'firstScan',
	'pantryCreated',
	'brain',
	'shopping'
] as const satisfies readonly ActivationProgressKey[];

export function progressKeyForScreen(screen: ActivationScreenId): ActivationProgressKey | null {
	const map: Partial<Record<ActivationScreenId, ActivationProgressKey>> = {
		welcome: 'welcome',
		scan: 'firstScan',
		success: 'pantryCreated',
		brain: 'brain',
		shopping: 'shopping'
	};
	return map[screen] ?? null;
}
