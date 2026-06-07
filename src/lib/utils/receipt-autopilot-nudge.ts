const DISMISS_COUNT_SUFFIX = 'receipt-autopilot-dismiss-count';

function storageKey(userId: string): string {
	return `home-pantry-${DISMISS_COUNT_SUFFIX}:${userId}`;
}

export function recordReceiptAutopilotDismiss(userId?: string | null): number {
	if (typeof localStorage === 'undefined' || !userId) {
		return 0;
	}

	const key = storageKey(userId);
	const next = Number(localStorage.getItem(key) ?? '0') + 1;
	localStorage.setItem(key, String(next));
	return next;
}

export function getReceiptAutopilotDismissCount(userId?: string | null): number {
	if (typeof localStorage === 'undefined' || !userId) {
		return 0;
	}

	return Number(localStorage.getItem(storageKey(userId)) ?? '0');
}

export function shouldNudgeReceiptAutopilot(userId?: string | null): boolean {
	return getReceiptAutopilotDismissCount(userId) >= 3;
}
