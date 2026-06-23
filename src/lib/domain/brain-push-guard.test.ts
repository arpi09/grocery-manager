import { describe, expect, it } from 'vitest';
import {
	brainPushDayKey,
	canSendBrainPush,
	isPreShopReminderDay,
	MAX_BRAIN_PUSHES_PER_DAY,
	nextBrainPushDailyState,
	shouldSendIntervalPush
} from './brain-push-guard';

describe('brain-push-guard', () => {
	it('allows up to max pushes per UTC day', () => {
		const now = new Date('2026-06-23T10:00:00.000Z');
		const day = brainPushDayKey(now);
		expect(canSendBrainPush(0, null, now)).toBe(true);
		expect(canSendBrainPush(MAX_BRAIN_PUSHES_PER_DAY - 1, day, now)).toBe(true);
		expect(canSendBrainPush(MAX_BRAIN_PUSHES_PER_DAY, day, now)).toBe(false);
	});

	it('resets count on a new day', () => {
		const now = new Date('2026-06-24T10:00:00.000Z');
		expect(canSendBrainPush(MAX_BRAIN_PUSHES_PER_DAY, '2026-06-23', now)).toBe(true);
		expect(nextBrainPushDailyState(3, '2026-06-23', now)).toEqual({
			count: 1,
			date: '2026-06-24'
		});
	});

	it('increments count within the same day', () => {
		const now = new Date('2026-06-23T12:00:00.000Z');
		expect(nextBrainPushDailyState(1, '2026-06-23', now)).toEqual({
			count: 2,
			date: '2026-06-23'
		});
	});

	it('flags Fri/Sat before dominant shop day', () => {
		expect(isPreShopReminderDay(5, 0)).toBe(true);
		expect(isPreShopReminderDay(6, 0)).toBe(true);
		expect(isPreShopReminderDay(4, 0)).toBe(false);
	});

	it('respects interval between pushes', () => {
		const now = new Date('2026-06-23T10:00:00.000Z');
		const recent = new Date('2026-06-22T10:00:00.000Z');
		expect(shouldSendIntervalPush(recent, 6, now)).toBe(false);
		expect(shouldSendIntervalPush(new Date('2026-06-16T10:00:00.000Z'), 6, now)).toBe(true);
	});
});
