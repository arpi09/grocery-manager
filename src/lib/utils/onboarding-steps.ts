/** Activation onboarding screens — state-driven, not a step carousel. */

import {
	deriveActivationScreen,
	getActivationProgressChecklist,
	type ActivationOnboardingFlags,
	type DeriveActivationOptions
} from '$lib/utils/activation-onboarding-state';

export type ActivationScreenId = 'welcome' | 'fill' | 'invite' | 'finish';

export const ACTIVATION_SCREEN_IDS = [
	'welcome',
	'fill',
	'invite',
	'finish'
] as const satisfies readonly ActivationScreenId[];

export const ACTIVATION_SCREEN_COUNT = ACTIVATION_SCREEN_IDS.length;

/** @deprecated Legacy export — activation flow uses ACTIVATION_SCREEN_COUNT. */
export const ONBOARDING_STEP_COUNT = ACTIVATION_SCREEN_COUNT;

/** v8: progress keys map 1:1 to screens. */
export type ActivationProgressKey = ActivationScreenId;

export const ACTIVATION_PROGRESS_KEYS = [
	'welcome',
	'fill',
	'invite',
	'finish'
] as const satisfies readonly ActivationProgressKey[];

export function progressKeyForScreen(screen: ActivationScreenId): ActivationProgressKey {
	return screen;
}

export function screenForProgressKey(key: ActivationProgressKey): ActivationScreenId {
	return key;
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
	options?: DeriveActivationOptions & { flowComplete?: boolean }
): boolean {
	const flowComplete = options?.flowComplete ?? flags.finishSeen;
	if (flowComplete) {
		return false;
	}

	const derived = deriveActivationScreen(flags, inventoryCount, flowComplete, {
		memberCount: options?.memberCount
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

	return checklist[target] === true;
}
