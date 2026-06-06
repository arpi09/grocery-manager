import { describe, expect, it } from 'vitest';
import { buildMilestones } from '$lib/domain/gamification';
import { resolveNextMilestone } from '$lib/domain/gamification.registry';

describe('gamification.registry', () => {
	it('resolves the first unachieved milestone as next step', () => {
		const milestones = buildMilestones({
			totalItems: 4,
			hasPlannedMeal: false,
			hasReceipt: false,
			consumedCount: 0,
			zeroWasteWeeks: 1,
			hasWeeklyRitual: false,
			savedSek: 120
		});

		const next = resolveNextMilestone(milestones, {
			totalItems: 4,
			zeroWasteWeeks: 1,
			savedSek: 120
		});

		expect(next?.id).toBe('firstConsumption');
		expect(next?.current).toBe(0);
		expect(next?.target).toBe(1);
	});

	it('tracks numeric progress for pantry and savings milestones', () => {
		const milestones = buildMilestones({
			totalItems: 7,
			hasPlannedMeal: true,
			hasReceipt: true,
			consumedCount: 2,
			zeroWasteWeeks: 0,
			hasWeeklyRitual: false,
			savedSek: 320
		});

		const next = resolveNextMilestone(milestones, {
			totalItems: 7,
			zeroWasteWeeks: 0,
			savedSek: 320
		});

		expect(next?.id).toBe('pantry10');
		expect(next?.current).toBe(7);
		expect(next?.target).toBe(10);
	});
});
