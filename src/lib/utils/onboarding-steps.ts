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

const SCREEN_TO_PROGRESS: Partial<Record<ActivationScreenId, ActivationProgressKey>> = {
	welcome: 'welcome',
	scan: 'firstScan',
	success: 'pantryCreated',
	brain: 'brain',
	shopping: 'shopping'
};

const PROGRESS_TO_SCREEN: Record<ActivationProgressKey, ActivationScreenId> = {
	welcome: 'welcome',
	firstScan: 'scan',
	pantryCreated: 'success',
	brain: 'brain',
	shopping: 'shopping'
};

export function progressKeyForScreen(screen: ActivationScreenId): ActivationProgressKey | null {
	return SCREEN_TO_PROGRESS[screen] ?? null;
}

export function screenForProgressKey(key: ActivationProgressKey): ActivationScreenId {
	return PROGRESS_TO_SCREEN[key];
}

export function canSelectProgressKey(
	key: ActivationProgressKey,
	checklist: Record<ActivationProgressKey, boolean>,
	currentKey: ActivationProgressKey | null
): boolean {
	if (currentKey === key) {
		return true;
	}
	return checklist[key] === true;
}
