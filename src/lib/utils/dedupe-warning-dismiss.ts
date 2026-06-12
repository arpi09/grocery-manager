import type { DedupeWarningKind } from '$lib/domain/dedupe-autopilot';

const DISMISS_PREFIX = 'dedupe-warn-dismiss:';

function dismissKey(householdId: string, normalizedKey: string, kind: DedupeWarningKind): string {
	return `${DISMISS_PREFIX}${householdId}:${normalizedKey}:${kind}`;
}

export function isDedupeWarningDismissed(
	householdId: string,
	normalizedKey: string,
	kind: DedupeWarningKind
): boolean {
	if (typeof sessionStorage === 'undefined') {
		return false;
	}
	return sessionStorage.getItem(dismissKey(householdId, normalizedKey, kind)) === '1';
}

export function dismissDedupeWarning(
	householdId: string,
	normalizedKey: string,
	kind: DedupeWarningKind
): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.setItem(dismissKey(householdId, normalizedKey, kind), '1');
}

export function filterVisibleDedupeWarnings<T extends { kind: DedupeWarningKind; normalizedKey: string }>(
	householdId: string | null,
	warnings: T[]
): T[] {
	if (!householdId) {
		return warnings;
	}
	return warnings.filter((entry) => !isDedupeWarningDismissed(householdId, entry.normalizedKey, entry.kind));
}
