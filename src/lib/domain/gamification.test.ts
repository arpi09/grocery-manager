import { describe, expect, it } from 'vitest';
import {
	buildMilestones,
	computeEatFirstRitualProgress,
	resolveWasteEventType,
	shouldCelebrateEatFirstRitual,
	shouldCelebrateFirstConsumption,
	shouldCelebrateZeroWasteStreak
} from './gamification';

describe('gamification domain', () => {
	it('resolves expired waste when best-before date has passed', () => {
		expect(
			resolveWasteEventType({
				quantity: '1',
				expiresOn: '2020-01-01'
			})
		).toBe('expired');
	});

	it('resolves discarded waste for active items without expiry', () => {
		expect(
			resolveWasteEventType({
				quantity: '2',
				expiresOn: null
			})
		).toBe('discarded');
	});

	it('skips waste logging for already finished items', () => {
		expect(
			resolveWasteEventType({
				quantity: '0',
				expiresOn: '2020-01-01'
			})
		).toBeNull();
	});

	it('tracks eat-first ritual completion from scheduled meals', () => {
		expect(computeEatFirstRitualProgress(3, 0).complete).toBe(false);
		expect(computeEatFirstRitualProgress(3, 1).complete).toBe(true);
	});

	it('detects celebration thresholds', () => {
		expect(shouldCelebrateFirstConsumption(1)).toBe(true);
		expect(shouldCelebrateFirstConsumption(2)).toBe(false);
		expect(shouldCelebrateZeroWasteStreak(2)).toBe(false);
		expect(shouldCelebrateZeroWasteStreak(3)).toBe(true);
		expect(shouldCelebrateEatFirstRitual(0, 1)).toBe(true);
		expect(shouldCelebrateEatFirstRitual(1, 1)).toBe(false);
	});

	it('builds milestone states from household signals', () => {
		const milestones = buildMilestones({
			totalItems: 12,
			hasPlannedMeal: true,
			hasReceipt: false,
			consumedCount: 4,
			zeroWasteWeeks: 3,
			hasWeeklyRitual: true,
			savedSek: 620
		});

		expect(milestones.find((m) => m.id === 'pantry10')?.achieved).toBe(true);
		expect(milestones.find((m) => m.id === 'firstReceipt')?.achieved).toBe(false);
		expect(milestones.find((m) => m.id === 'zeroWaste3')?.achieved).toBe(true);
		expect(milestones.find((m) => m.id === 'weeklyRitualFirst')?.achieved).toBe(true);
		expect(milestones.find((m) => m.id === 'savings500')?.achieved).toBe(true);
		expect(milestones.find((m) => m.id === 'streak5')?.achieved).toBe(false);
	});
});
