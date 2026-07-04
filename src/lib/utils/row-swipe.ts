/** Minimum horizontal drag before a swipe action commits (matches calendar month nav). */
export const SWIPE_COMMIT_THRESHOLD_PX = 72;

/** Maximum visual offset while dragging. */
export const SWIPE_MAX_OFFSET_PX = 96;

/** Movement before locking swipe to horizontal or vertical axis. */
export const SWIPE_AXIS_LOCK_PX = 8;

export type SwipeAction = 'finish' | 'partial' | null;

export function clampSwipeOffset(
	offsetPx: number,
	max: number = SWIPE_MAX_OFFSET_PX
): number {
	return Math.max(-max, Math.min(max, offsetPx));
}

/** Negated drag delta so row motion reveals the hint that matches resolveSwipeAction. */
export function swipeDisplayOffset(
	deltaX: number,
	max: number = SWIPE_MAX_OFFSET_PX
): number {
	return clampSwipeOffset(-deltaX, max);
}

export function resolveSwipeAction(
	offsetPx: number,
	threshold: number = SWIPE_COMMIT_THRESHOLD_PX
): SwipeAction {
	if (offsetPx >= threshold) return 'finish';
	if (offsetPx <= -threshold) return 'partial';
	return null;
}

export function resolveSwipeAxis(
	deltaX: number,
	deltaY: number,
	lockPx: number = SWIPE_AXIS_LOCK_PX
): 'x' | 'y' | null {
	if (Math.abs(deltaX) < lockPx && Math.abs(deltaY) < lockPx) return null;
	return Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
}

/* Inventory row swipe-to-consume (left swipe reveals a green "use" surface). */

/** Resting width of the revealed surface once a swipe settles open. */
export const CONSUME_SWIPE_REVEAL_PX = 72;

/** Release at or past this offset triggers consume directly (full swipe). */
export const CONSUME_SWIPE_COMMIT_PX = SWIPE_COMMIT_THRESHOLD_PX;

/** Release at or past this offset settles the surface open for a tap. */
export const CONSUME_SWIPE_OPEN_PX = 36;

/** How much of the surface the first-visit auto-peek reveals. */
export const CONSUME_SWIPE_PEEK_PX = 28;

export type ConsumeSwipeRelease = 'commit' | 'open' | 'close';

/** Left-swipe only: reveal offset from a horizontal drag delta plus resting base. */
export function consumeSwipeOffset(
	deltaX: number,
	baseOffset = 0,
	max: number = SWIPE_MAX_OFFSET_PX
): number {
	return Math.max(0, Math.min(max, baseOffset - deltaX));
}

export function resolveConsumeSwipeRelease(offsetPx: number): ConsumeSwipeRelease {
	if (offsetPx >= CONSUME_SWIPE_COMMIT_PX) return 'commit';
	if (offsetPx >= CONSUME_SWIPE_OPEN_PX) return 'open';
	return 'close';
}
