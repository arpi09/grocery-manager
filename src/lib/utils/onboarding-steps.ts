/** Activation onboarding screens — state-driven, not a step carousel. */

import {
	deriveActivationScreen,
	getActivationProgressChecklist,
	type ActivationOnboardingFlags
} from '$lib/utils/activation-onboarding-state';

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

export function screenIndex(screen: ActivationScreenId): number {
	return ACTIVATION_SCREEN_IDS.indexOf(screen);
}

export function previousScreen(current: ActivationScreenId): ActivationScreenId | null {
	const index = screenIndex(current);
	return index > 0 ? ACTIVATION_SCREEN_IDS[index - 1] : null;
}

export function nextScreen(current: ActivationScreenId): ActivationScreenId | null {
	const index = screenIndex(current);
	return index >= 0 && index < ACTIVATION_SCREEN_IDS.length - 1
		? ACTIVATION_SCREEN_IDS[index + 1]
		: null;
}

export function canSelectProgressKey(
	key: ActivationProgressKey,
	checklist: Record<ActivationProgressKey, boolean>,
	currentKey: ActivationProgressKey | null
): boolean {
	if (currentKey === key) {
		return true;
	}
	if (!currentKey) {
		return checklist[key] === true;
	}
	const currentIndex = ACTIVATION_PROGRESS_KEYS.indexOf(currentKey);
	const keyIndex = ACTIVATION_PROGRESS_KEYS.indexOf(key);
	return keyIndex <= currentIndex;
}

export function canNavigateToScreen(
	target: ActivationScreenId,
	flags: ActivationOnboardingFlags,
	inventoryCount: number,
	options?: { skipSuccessScreen?: boolean; flowComplete?: boolean }
): boolean {
	const flowComplete = options?.flowComplete ?? flags.shoppingSeen;
	if (flowComplete) {
		return false;
	}

	const derived = deriveActivationScreen(flags, inventoryCount, flowComplete, {
		skipSuccessScreen: options?.skipSuccessScreen
	});
	if (derived === 'complete') {
		return false;
	}

	const checklist = getActivationProgressChecklist(flags, inventoryCount);
	const targetIndex = screenIndex(target);
	const derivedIndex = screenIndex(derived);

	if (targetIndex <= derivedIndex) {
		return true;
	}

	const targetKey = progressKeyForScreen(target);
	if (targetKey && checklist[targetKey]) {
		return true;
	}

	if (targetIndex !== derivedIndex + 1) {
		return false;
	}

	if (target === 'success') {
		return checklist.pantryCreated || inventoryCount >= 1 || flags.firstScanDone;
	}

	return true;
}
