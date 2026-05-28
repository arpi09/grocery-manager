/** User is considered active if seen within this window. */
export const ACTIVE_USER_WINDOW_MS = 5 * 60 * 1000;

export function isUserActiveNow(lastSeenAt: Date | null | undefined, now = Date.now()): boolean {
	if (!lastSeenAt) {
		return false;
	}
	return now - lastSeenAt.getTime() < ACTIVE_USER_WINDOW_MS;
}

export function formatLastSeen(lastSeenAt: Date | null | undefined): string {
	if (!lastSeenAt) {
		return 'Aldrig';
	}
	return new Intl.DateTimeFormat('sv-SE', {
		dateStyle: 'short',
		timeStyle: 'short'
	}).format(lastSeenAt);
}
