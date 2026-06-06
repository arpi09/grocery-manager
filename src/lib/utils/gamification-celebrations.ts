import type { GamificationCelebrationKind, MilestoneId } from '$lib/domain/gamification';

const PREFIX = 'home-pantry-gamification-celebrated';
const MILESTONE_PREFIX = 'home-pantry-milestone-seen';

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

function milestoneStorageKey(id: MilestoneId, householdId: string): string {
	return `${MILESTONE_PREFIX}-${id}-${householdId}`;
}

export function shouldAnimateMilestoneUnlock(id: MilestoneId, householdId: string): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	return localStorage.getItem(milestoneStorageKey(id, householdId)) !== '1';
}

export function markMilestoneUnlockSeen(id: MilestoneId, householdId: string): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(milestoneStorageKey(id, householdId), '1');
}
