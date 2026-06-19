import { describe, expect, it } from 'vitest';
import type { InventoryItem } from './inventory-item';
import type { ReplenishmentSuggestion } from './replenishment';
import {
	buildHomeBriefingChipsPresentation,
	buildHomeBriefingForYouPresentation,
	buildHomeBriefingGreetingPresentation,
	buildHomeBriefingStatusPresentation,
	buildShoppingChipTripName
} from './home-briefing-presenter';

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
	reasonCode: 'cadence_overdue',
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

describe('home-briefing-presenter', () => {
	it('builds greeting with and without display name', () => {
		expect(buildHomeBriefingGreetingPresentation('Anna')).toEqual({
			key: 'home.v6.greeting',
			params: { name: 'Anna' }
		});
		expect(buildHomeBriefingGreetingPresentation('  ').key).toBe('home.v6.greetingFallback');
	});

	it('builds status params for combined use-soon and list ready', () => {
		const presentation = buildHomeBriefingStatusPresentation(
			{ key: 'useSoonAndList', useSoonCount: 4, weekday: 5 },
			'sv'
		);
		expect(presentation.key).toBe('home.v6.status.useSoonAndList');
		expect(presentation.params.useSoonCount).toBe(4);
		expect(presentation.params.weekday).toBeTruthy();
	});

	it('builds replenishment card copy', () => {
		const copy = buildHomeBriefingForYouPresentation(
			{ kind: 'replenishment', suggestion },
			'sv'
		);
		expect(copy.title).toEqual({
			key: 'home.v6.forYou.replenishment.title',
			params: { name: 'Milk' }
		});
		expect(copy.body.params.interval).toBe(7);
	});

	it('builds shop-ready card copy with weekday', () => {
		const copy = buildHomeBriefingForYouPresentation(
			{ kind: 'shopReady', itemCount: 3, weekday: 5 },
			'en'
		);
		expect(copy.body.key).toBe('home.v6.forYou.shopReady.body');
		expect(copy.body.params.count).toBe(3);
		expect(copy.body.params.weekday).toBeTruthy();
	});

	it('prefers store label for shopping chip trip name', () => {
		expect(buildShoppingChipTripName(cadence)).toBe('ICA');
		expect(
			buildHomeBriefingChipsPresentation({
				useSoonCount: 2,
				shoppingCadence: cadence,
				locale: 'sv'
			}).shopping
		).toEqual({ useTripName: true, tripName: 'ICA' });
	});

	it('falls back to weekday chip label without store label', () => {
		const chips = buildHomeBriefingChipsPresentation({
			useSoonCount: 1,
			shoppingCadence: { weekday: 5, storeLabel: null, tripCount: 2 },
			locale: 'sv'
		});
		expect(chips.shopping.useTripName).toBe(true);
		expect(chips.shopping.tripName.length).toBeGreaterThan(3);
	});

	it('builds expiring card copy', () => {
		const copy = buildHomeBriefingForYouPresentation(
			{
				kind: 'expiring',
				item: expiringItem,
				daysUntilExpiry: 1,
				suggestion: 'fridge'
			},
			'en'
		);
		expect(copy.title.params.name).toBe('Yogurt');
		expect(copy.body.params.days).toBe(1);
	});
});
