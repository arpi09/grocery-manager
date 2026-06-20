import { describe, expect, it } from 'vitest';
import type { InventoryItem } from './inventory-item';
import type { ReplenishmentSuggestion } from './replenishment';
import { deriveHomeForYou } from './home-for-you';

const suggestion: ReplenishmentSuggestion = {
	normalizedKey: 'mjolk',
	displayName: 'Milk',
	location: 'fridge',
	quantity: '1',
	unit: 'l',
	importCount: 3,
	lineCount: 4,
	lastPurchasedAt: new Date('2026-06-01'),
	reasonCode: 'recurring_not_in_pantry',
	daysSinceLast: 14,
	avgIntervalDays: 7,
	purchaseCount: 4
};

const expiringItem: InventoryItem = {
	id: 'item-1',
	householdId: 'hh-1',
	userId: 'user-1',
	name: 'Yogurt',
	location: 'fridge',
	quantity: '1',
	unit: null,
	expiresOn: '2026-06-18',
	expiresOnSource: null,
	notes: null,
	barcode: null,
	lastConfirmedAt: new Date('2026-06-01'),
	createdAt: new Date('2026-06-01'),
	updatedAt: new Date('2026-06-01')
};

describe('deriveHomeForYou', () => {
	it('prefers replenishment over expiring items', () => {
		expect(deriveHomeForYou({ replenishment: [suggestion] }, [expiringItem])).toEqual({
			kind: 'replenishment',
			suggestion
		});
	});

	it('falls back to the first expiring item when replenishment is empty', () => {
		expect(deriveHomeForYou({ replenishment: [] }, [expiringItem])).toEqual({
			kind: 'expiring',
			item: expiringItem
		});
	});

	it('returns null when there is no recommendation', () => {
		expect(deriveHomeForYou({ replenishment: [] }, [])).toBeNull();
	});
});
