import type { GamificationCelebrationKind } from '$lib/domain/gamification';

const PREFIX = 'home-pantry-gamification-celebrated';

function storageKey(kind: GamificationCelebrationKind, householdId: string): string {
	return `${PREFIX}-${kind}-${householdId}`;
}

export function shouldShowCelebration(
	kind: GamificationCelebrationKind,
	householdId: string
): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	return localStorage.getItem(storageKey(kind, householdId)) !== '1';
}

export function markCelebrationShown(kind: GamificationCelebrationKind, householdId: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(storageKey(kind, householdId), '1');
}

export function clearCelebrationShown(kind: GamificationCelebrationKind, householdId: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.removeItem(storageKey(kind, householdId));
}
