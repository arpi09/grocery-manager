import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	celebrationMomentStore,
	presentCelebration,
	resetCelebrationSessionForTests,
	dismissCelebrationMoment
} from './present-celebration.svelte';
import * as celebrations from './gamification-celebrations';
import { showClientToast } from './client-toast.svelte';

vi.mock('./gamification-celebrations', () => ({
	shouldShowCelebration: vi.fn(() => true),
	markCelebrationShown: vi.fn()
}));

vi.mock('./client-toast.svelte', () => ({
	showClientToast: vi.fn()
}));

describe('presentCelebration', () => {
	beforeEach(() => {
		resetCelebrationSessionForTests();
		vi.mocked(celebrations.shouldShowCelebration).mockReturnValue(true);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
	});

	it('opens a celebration moment for milestone unlocks', () => {
		const shown = presentCelebration({
			kind: 'firstConsumption',
			surface: 'moment',
			householdId: 'house-1',
			metadata: { milestoneId: 'firstConsumption' }
		});

		expect(shown).toBe(true);
		expect(celebrationMomentStore.active?.request.kind).toBe('firstConsumption');
		expect(celebrationMomentStore.active?.illustration).toBe('milestone');
	});

	it('dedupes via shouldShowCelebration', () => {
		vi.mocked(celebrations.shouldShowCelebration).mockReturnValue(false);

		const shown = presentCelebration({
			kind: 'zeroWasteStreak',
			surface: 'moment',
			householdId: 'house-1'
		});

		expect(shown).toBe(false);
		expect(celebrationMomentStore.active).toBeNull();
	});

	it('marks celebration shown only on dismiss', () => {
		presentCelebration({
			kind: 'weeklyRitualFirst',
			surface: 'moment',
			householdId: 'house-1'
		});

		expect(celebrations.markCelebrationShown).not.toHaveBeenCalled();

		dismissCelebrationMoment();

		expect(celebrations.markCelebrationShown).toHaveBeenCalledWith(
			'weeklyRitualFirst',
			'house-1'
		);
		expect(celebrationMomentStore.active).toBeNull();
	});

	it('limits to one celebration per session', () => {
		presentCelebration({
			kind: 'firstConsumption',
			surface: 'moment',
			householdId: 'house-1'
		});

		const second = presentCelebration({
			kind: 'zeroWasteStreak',
			surface: 'moment',
			householdId: 'house-1'
		});

		expect(second).toBe(false);
	});

	it('shows a celebrate toast with dismiss bookkeeping', () => {
		const shown = presentCelebration({
			kind: 'eatFirstRitual',
			surface: 'toast',
			householdId: 'house-1'
		});

		expect(shown).toBe(true);
		expect(showClientToast).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				variant: 'success',
				size: 'action',
				celebrate: true,
				onDismiss: expect.any(Function)
			})
		);

		const options = vi.mocked(showClientToast).mock.calls.at(-1)?.[1];
		options?.onDismiss?.();
		expect(celebrations.markCelebrationShown).toHaveBeenCalledWith('eatFirstRitual', 'house-1');
	});
});
