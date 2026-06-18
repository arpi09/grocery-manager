import { describe, expect, it } from 'vitest';
import type { ReplenishmentSuggestion } from './replenishment';
import {
	buildMemoryCadencePresentation,
	buildPlanHeaderTitle,
	visibleMemorySuggestions
} from './shopping-v2-presenter';

function suggestion(
	overrides: Partial<ReplenishmentSuggestion> = {}
): ReplenishmentSuggestion {
	return {
		normalizedKey: 'mjolk',
		displayName: 'Mjölk',
		location: 'fridge',
		quantity: '1',
		unit: 'L',
		importCount: 3,
		lineCount: 4,
		lastPurchasedAt: new Date('2026-01-01'),
		reasonCode: 'cadence_overdue',
		daysSinceLast: 10,
		avgIntervalDays: 7,
		purchaseCount: 4,
		...overrides
	};
}

describe('shopping-v2-presenter', () => {
	it('limits visible memory suggestions to three', () => {
		const list = Array.from({ length: 5 }, (_, index) =>
			suggestion({ normalizedKey: `key-${index}`, displayName: `Item ${index}` })
		);
		expect(visibleMemorySuggestions(list)).toHaveLength(3);
	});

	it('builds cadence presentation from reason code', () => {
		expect(buildMemoryCadencePresentation(suggestion()).key).toBe(
			'replenishment.reason.cadenceOverdue'
		);
		expect(
			buildMemoryCadencePresentation(
				suggestion({ reasonCode: 'recurring_not_in_pantry' })
			).key
		).toBe('replenishment.reason.recurringNotInPantry');
	});

	it('prefers trip label when set', () => {
		expect(buildPlanHeaderTitle('Fredagshandling')).toEqual({
			useTripLabel: true,
			tripLabel: 'Fredagshandling'
		});
		expect(buildPlanHeaderTitle(null).useTripLabel).toBe(false);
	});
});
