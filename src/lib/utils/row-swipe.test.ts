import { describe, expect, it } from 'vitest';
import {
	clampSwipeOffset,
	resolveSwipeAction,
	resolveSwipeAxis,
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
});
