import type { ExpiringShareItemSnapshot } from '$lib/domain/expiring-share';

/** Max one nearby-share push per viewer per 24 hours. */
export const NEARBY_PUSH_DEBOUNCE_MS = 24 * 60 * 60 * 1000;

/** Cap viewers notified per share event to protect prod. */
export const NEARBY_PUSH_MAX_VIEWERS = 50;

export function shouldSendNearbyPush(
	lastSentAt: Date | null | undefined,
	now = new Date()
): boolean {
	if (!lastSentAt) {
		return true;
	}
	return now.getTime() - lastSentAt.getTime() >= NEARBY_PUSH_DEBOUNCE_MS;
}

/** Build push body from snapshot items — 2–3 names plus optional overflow suffix. */
export function formatNearbyPushPreviewBody(
	items: Pick<ExpiringShareItemSnapshot, 'name'>[],
	overflowSuffix?: (count: number) => string
): string {
	if (items.length === 0) {
		return '';
	}

	const previewCount = Math.min(3, items.length);
	const names = items.slice(0, previewCount).map((item) => item.name);

	if (items.length <= 3) {
		return names.join(', ');
	}

	const overflow = items.length - 2;
	const suffix = overflowSuffix?.(overflow) ?? `(+${overflow})`;
	return `${names.slice(0, 2).join(', ')} ${suffix}`.trim();
}
