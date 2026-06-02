import { daysUntilExpiry } from '$lib/domain/expiry';
import type { InventoryItem } from '$lib/domain/inventory-item';

export const EAT_FIRST_RITUAL_GOAL = 1;
export const ZERO_WASTE_STREAK_CELEBRATION = 3;
export const PANTRY_MILESTONE_ITEMS = 10;

export type GamificationCelebrationKind =
	| 'firstConsumption'
	| 'zeroWasteStreak'
	| 'eatFirstRitual';

export type MilestoneId =
	| 'pantry10'
	| 'firstPlan'
	| 'firstReceipt'
	| 'firstConsumption'
	| 'zeroWaste3';

export interface EatFirstRitualProgress {
	suggestionsThisWeek: number;
	mealsScheduledThisWeek: number;
	goal: number;
	complete: boolean;
}

export interface MilestoneState {
	id: MilestoneId;
	achieved: boolean;
}

export function resolveWasteEventType(
	item: Pick<InventoryItem, 'expiresOn' | 'quantity'>
): 'discarded' | 'expired' | null {
	if (Number(item.quantity) <= 0) {
		return null;
	}

	if (item.expiresOn && daysUntilExpiry(item.expiresOn) < 0) {
		return 'expired';
	}

	return 'discarded';
}

export function computeEatFirstRitualProgress(
	suggestionsThisWeek: number,
	mealsScheduledThisWeek: number
): EatFirstRitualProgress {
	return {
		suggestionsThisWeek,
		mealsScheduledThisWeek,
		goal: EAT_FIRST_RITUAL_GOAL,
		complete: mealsScheduledThisWeek >= EAT_FIRST_RITUAL_GOAL
	};
}

export function shouldCelebrateZeroWasteStreak(zeroWasteWeeks: number | null): boolean {
	return zeroWasteWeeks != null && zeroWasteWeeks >= ZERO_WASTE_STREAK_CELEBRATION;
}

export function shouldCelebrateFirstConsumption(consumedCount: number): boolean {
	return consumedCount === 1;
}

export function shouldCelebrateEatFirstRitual(
	scheduledThisWeekBefore: number,
	scheduledThisWeekAfter: number
): boolean {
	return (
		scheduledThisWeekBefore < EAT_FIRST_RITUAL_GOAL &&
		scheduledThisWeekAfter >= EAT_FIRST_RITUAL_GOAL
	);
}

export function buildMilestones(input: {
	totalItems: number;
	hasPlannedMeal: boolean;
	hasReceipt: boolean;
	consumedCount: number;
	zeroWasteWeeks: number | null;
}): MilestoneState[] {
	return [
		{ id: 'pantry10', achieved: input.totalItems >= PANTRY_MILESTONE_ITEMS },
		{ id: 'firstPlan', achieved: input.hasPlannedMeal },
		{ id: 'firstReceipt', achieved: input.hasReceipt },
		{ id: 'firstConsumption', achieved: input.consumedCount > 0 },
		{
			id: 'zeroWaste3',
			achieved: (input.zeroWasteWeeks ?? 0) >= ZERO_WASTE_STREAK_CELEBRATION
		}
	];
}
