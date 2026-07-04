import { describe, expect, it } from 'vitest';
import {
	clampSwipeOffset,
	consumeSwipeOffset,
	resolveConsumeSwipeRelease,
	resolveSwipeAction,
	resolveSwipeAxis,
	swipeDisplayOffset,
	CONSUME_SWIPE_COMMIT_PX,
	CONSUME_SWIPE_OPEN_PX,
	CONSUME_SWIPE_PEEK_PX,
	CONSUME_SWIPE_REVEAL_PX,
	SWIPE_COMMIT_THRESHOLD_PX,
	SWIPE_MAX_OFFSET_PX
} from './row-swipe';

describe('row-swipe helpers', () => {
	it('clamps offset to max range', () => {
		expect(clampSwipeOffset(0)).toBe(0);
		expect(clampSwipeOffset(SWIPE_MAX_OFFSET_PX)).toBe(SWIPE_MAX_OFFSET_PX);
		expect(clampSwipeOffset(-SWIPE_MAX_OFFSET_PX)).toBe(-SWIPE_MAX_OFFSET_PX);
		expect(clampSwipeOffset(200)).toBe(SWIPE_MAX_OFFSET_PX);
		expect(clampSwipeOffset(-200)).toBe(-SWIPE_MAX_OFFSET_PX);
	});

	it('resolves finish on swipe right and partial on swipe left', () => {
		expect(resolveSwipeAction(0)).toBeNull();
		expect(resolveSwipeAction(SWIPE_COMMIT_THRESHOLD_PX - 1)).toBeNull();
		expect(resolveSwipeAction(SWIPE_COMMIT_THRESHOLD_PX)).toBe('finish');
		expect(resolveSwipeAction(120)).toBe('finish');
		expect(resolveSwipeAction(-SWIPE_COMMIT_THRESHOLD_PX)).toBe('partial');
		expect(resolveSwipeAction(-90)).toBe('partial');
	});

	it('locks axis from dominant movement', () => {
		expect(resolveSwipeAxis(0, 0)).toBeNull();
		expect(resolveSwipeAxis(20, 2)).toBe('x');
		expect(resolveSwipeAxis(2, 20)).toBe('y');
	});

	it('pairs display offset with action hints (right → finish, left → partial)', () => {
		const swipeRight = SWIPE_COMMIT_THRESHOLD_PX;
		expect(resolveSwipeAction(swipeRight)).toBe('finish');
		expect(swipeDisplayOffset(swipeRight)).toBe(-swipeRight);

		const swipeLeft = -SWIPE_COMMIT_THRESHOLD_PX;
		expect(resolveSwipeAction(swipeLeft)).toBe('partial');
		expect(swipeDisplayOffset(swipeLeft)).toBe(-swipeLeft);
	});

	it('negates drag delta for display while clamping to max offset', () => {
		expect(swipeDisplayOffset(120)).toBe(-SWIPE_MAX_OFFSET_PX);
		expect(swipeDisplayOffset(-120)).toBe(SWIPE_MAX_OFFSET_PX);
	});
});

describe('consume swipe helpers', () => {
	it('only reveals on left drags and clamps to max', () => {
		expect(consumeSwipeOffset(-40)).toBe(40);
		expect(consumeSwipeOffset(40)).toBe(0);
		expect(consumeSwipeOffset(-500)).toBe(SWIPE_MAX_OFFSET_PX);
	});

	it('starts from the open base offset so a right drag closes an open row', () => {
		expect(consumeSwipeOffset(30, CONSUME_SWIPE_REVEAL_PX)).toBe(CONSUME_SWIPE_REVEAL_PX - 30);
		expect(consumeSwipeOffset(200, CONSUME_SWIPE_REVEAL_PX)).toBe(0);
	});

	it('resolves release: full swipe commits, partial opens, short closes', () => {
		expect(resolveConsumeSwipeRelease(CONSUME_SWIPE_COMMIT_PX)).toBe('commit');
		expect(resolveConsumeSwipeRelease(SWIPE_MAX_OFFSET_PX)).toBe('commit');
		expect(resolveConsumeSwipeRelease(CONSUME_SWIPE_OPEN_PX)).toBe('open');
		expect(resolveConsumeSwipeRelease(CONSUME_SWIPE_COMMIT_PX - 1)).toBe('open');
		expect(resolveConsumeSwipeRelease(CONSUME_SWIPE_OPEN_PX - 1)).toBe('close');
		expect(resolveConsumeSwipeRelease(0)).toBe('close');
	});

	it('keeps the peek offset below the open threshold', () => {
		expect(CONSUME_SWIPE_PEEK_PX).toBeLessThan(CONSUME_SWIPE_OPEN_PX);
		expect(CONSUME_SWIPE_PEEK_PX).toBeGreaterThanOrEqual(24);
	});
});
