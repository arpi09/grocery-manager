import { describe, expect, it } from 'vitest';
import type { InventoryItem } from './inventory-item';
import type { ReplenishmentSuggestion } from './replenishment';
import {
	isShoppingListReady,
	selectHomeBriefingForYouCard,
	selectHomeBriefingMomentCard,
	selectHomeBriefingStatus,
	type HomeBriefingRecipeCard
} from './home-briefing';

const cadence = { weekday: 5, storeLabel: 'ICA', tripCount: 4 };

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
	expiresOn: '2026-06-20',
	expiresOnSource: null,
	notes: null,
	lastConfirmedAt: new Date('2026-06-01'),
	createdAt: new Date('2026-06-01'),
	updatedAt: new Date('2026-06-01')
};

const recipeCard: HomeBriefingRecipeCard = {
	kind: 'recipe',
	ideaId: 'idea-1',
	mealName: 'Pasta salad',
	expiringItemNames: ['Pasta', 'Feta'],
	expiresWhenLabel: 'this weekend',
	servings: 2,
	missingCount: 2,
	missingIngredients: ['Basilika', 'Olivolja'],
	shopWeekday: 5
};

describe('isShoppingListReady', () => {
	it('requires both list items and cadence', () => {
		expect(isShoppingListReady(3, cadence)).toBe(true);
		expect(isShoppingListReady(0, cadence)).toBe(false);
		expect(isShoppingListReady(3, null)).toBe(false);
	});
});

describe('selectHomeBriefingStatus', () => {
	it('returns emptyPantry when there are no items', () => {
		expect(
			selectHomeBriefingStatus({
				totalItems: 0,
				useSoonCount: 0,
				shoppingListCount: 0,
				shoppingCadence: null,
				intelligence: { replenishment: [] },
				expiringSoon: []
			})
		).toEqual({ key: 'emptyPantry' });
	});

	it('combines use-soon and list ready', () => {
		expect(
			selectHomeBriefingStatus({
				totalItems: 12,
				useSoonCount: 4,
				shoppingListCount: 6,
				shoppingCadence: cadence,
				intelligence: { replenishment: [] },
				expiringSoon: [expiringItem]
			})
		).toEqual({ key: 'useSoonAndList', useSoonCount: 4, weekday: 5 });
	});

	it('prefers use-soon only when list is not ready', () => {
		expect(
			selectHomeBriefingStatus({
				totalItems: 12,
				useSoonCount: 2,
				shoppingListCount: 0,
				shoppingCadence: null,
				intelligence: { replenishment: [] },
				expiringSoon: [expiringItem]
			})
		).toEqual({ key: 'useSoonOnly', count: 2 });
	});

	it('shows list ready when cadence exists', () => {
		expect(
			selectHomeBriefingStatus({
				totalItems: 12,
				useSoonCount: 0,
				shoppingListCount: 3,
				shoppingCadence: cadence,
				intelligence: { replenishment: [] },
				expiringSoon: []
			})
		).toEqual({ key: 'listReady', weekday: 5 });
	});

	it('falls back to list item count without cadence', () => {
		expect(
			selectHomeBriefingStatus({
				totalItems: 12,
				useSoonCount: 0,
				shoppingListCount: 3,
				shoppingCadence: null,
				intelligence: { replenishment: [] },
				expiringSoon: []
			})
		).toEqual({ key: 'listItems', count: 3 });
	});

	it('returns allGood on a quiet week', () => {
		expect(
			selectHomeBriefingStatus({
				totalItems: 12,
				useSoonCount: 0,
				shoppingListCount: 0,
				shoppingCadence: null,
				intelligence: { replenishment: [] },
				expiringSoon: []
			})
		).toEqual({ key: 'allGood' });
	});
});

describe('selectHomeBriefingForYouCard', () => {
	const baseInput = {
		totalItems: 12,
		useSoonCount: 1,
		shoppingListCount: 3,
		shoppingCadence: cadence,
		intelligence: { replenishment: [suggestion] },
		expiringSoon: [expiringItem],
		today: new Date('2026-06-19')
	};

	it('prefers recipe over other signals', () => {
		expect(selectHomeBriefingForYouCard({ ...baseInput, recipeSuggestion: recipeCard })).toEqual(
			recipeCard
		);
	});

	it('prefers replenishment over expiring and shop ready', () => {
		expect(selectHomeBriefingForYouCard(baseInput)).toEqual({
			kind: 'replenishment',
			suggestion
		});
	});

	it('falls back to expiring when replenishment is empty', () => {
		expect(
			selectHomeBriefingForYouCard({
				...baseInput,
				intelligence: { replenishment: [] }
			})
		).toMatchObject({
			kind: 'expiring',
			item: expiringItem,
			daysUntilExpiry: 1
		});
	});

	it('shows shop ready when only list + cadence exist', () => {
		expect(
			selectHomeBriefingForYouCard({
				...baseInput,
				intelligence: { replenishment: [] },
				expiringSoon: []
			})
		).toEqual({
			kind: 'shopReady',
			itemCount: 3,
			weekday: 5
		});
	});

	it('returns null when there is no actionable card', () => {
		expect(
			selectHomeBriefingForYouCard({
				...baseInput,
				shoppingListCount: 0,
				shoppingCadence: null,
				intelligence: { replenishment: [] },
				expiringSoon: []
			})
		).toBeNull();
	});
});

const quietInput = {
	totalItems: 12,
	useSoonCount: 0,
	shoppingListCount: 0,
	shoppingCadence: null,
	intelligence: { replenishment: [] },
	expiringSoon: [],
	today: new Date('2026-06-19')
};

describe('selectHomeBriefingMomentCard', () => {
	it('returns null when for-you card is shown', () => {
		expect(
			selectHomeBriefingMomentCard({
				...quietInput,
				intelligence: { replenishment: [suggestion] }
			})
		).toBeNull();
	});

	it('returns emptyPantry when there are no items', () => {
		expect(
			selectHomeBriefingMomentCard({
				...quietInput,
				totalItems: 0
			})
		).toEqual({ kind: 'emptyPantry' });
	});

	it('prefers openShopping when list has items without cadence', () => {
		expect(
			selectHomeBriefingMomentCard({
				...quietInput,
				shoppingListCount: 3
			})
		).toEqual({ kind: 'openShopping' });
	});

	it('rotates calm tips deterministically by calendar day', () => {
		const dayA = selectHomeBriefingMomentCard({
			...quietInput,
			today: new Date('2026-06-19')
		});
		const dayASame = selectHomeBriefingMomentCard({
			...quietInput,
			today: new Date('2026-06-19T23:59:59')
		});
		const dayB = selectHomeBriefingMomentCard({
			...quietInput,
			today: new Date('2026-06-20')
		});

		expect(dayA).toEqual(dayASame);
		expect(dayA?.kind).not.toBe('emptyPantry');
		expect(dayA?.kind).not.toBe('openShopping');
		expect(dayB?.kind).not.toBe(dayA?.kind);
	});
});
