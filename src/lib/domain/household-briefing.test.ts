import { describe, expect, it } from 'vitest';
import {
	composeHouseholdBriefing,
	briefingVisiblePantryHealth
} from './household-briefing';
import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';

function snapshot(
	overrides: Partial<HomeIntelligenceSnapshot> = {}
): HomeIntelligenceSnapshot {
	return {
		replenishment: [],
		pantryHealth: [],
		waste: null,
		dedupeByKey: {},
		...overrides
	};
}

describe('composeHouseholdBriefing', () => {
	it('prioritizes waste over replenishment and sync', () => {
		const briefing = composeHouseholdBriefing({
			intelligence: snapshot({
				waste: { expiringCount: 2, slowMoverCount: 0, href: '#eat-first' },
				replenishment: [
					{
						normalizedKey: 'mjolk',
						displayName: 'Mjölk',
						location: 'fridge',
						quantity: '1',
						unit: 'L',
						importCount: 2,
						lineCount: 2,
						lastPurchasedAt: new Date(),
						reasonCode: 'recurring_not_in_pantry',
						daysSinceLast: 10,
						avgIntervalDays: null,
						purchaseCount: 2
					}
				]
			}),
			staleCount: 4,
			shoppingListCount: 1
		});

		expect(briefing.primaryKind).toBe('waste');
		expect(briefing.replenishment).toHaveLength(1);
		expect(briefing.showSync).toBe(true);
		expect(briefing.hasActionableContent).toBe(true);
	});

	it('uses replenishment when no waste signal exists', () => {
		const briefing = composeHouseholdBriefing({
			intelligence: snapshot({
				replenishment: [
					{
						normalizedKey: 'mjolk',
						displayName: 'Mjölk',
						location: 'fridge',
						quantity: '1',
						unit: 'L',
						importCount: 2,
						lineCount: 2,
						lastPurchasedAt: new Date(),
						reasonCode: 'recurring_not_in_pantry',
						daysSinceLast: 10,
						avgIntervalDays: null,
						purchaseCount: 2
					}
				]
			}),
			staleCount: 0,
			shoppingListCount: 0
		});

		expect(briefing.primaryKind).toBe('replenishment');
		expect(briefing.showShoppingTeaser).toBe(true);
	});

	it('falls back to sync when stale items exist without pantry health stale insight', () => {
		const briefing = composeHouseholdBriefing({
			intelligence: snapshot(),
			staleCount: 3,
			shoppingListCount: 0
		});

		expect(briefing.primaryKind).toBe('sync');
		expect(briefing.hideWeeklyRitualSync).toBe(true);
	});

	it('limits visible pantry health lines under waste primary', () => {
		const briefing = composeHouseholdBriefing({
			intelligence: snapshot({
				waste: { expiringCount: 1, slowMoverCount: 0, href: '#eat-first' },
				pantryHealth: [
					{ kind: 'duplicate', id: 'duplicate:beans', count: 2, displayName: 'Beans', href: '/inventory/merge' },
					{ kind: 'overstock', id: 'overstock:rice', count: 4, displayName: 'Rice', href: '/inventory/cupboard' }
				]
			}),
			staleCount: 0,
			shoppingListCount: 0
		});

		expect(briefingVisiblePantryHealth(briefing)).toHaveLength(2);
	});
});
