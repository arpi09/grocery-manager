import { describe, expect, it } from 'vitest';
import type { InventoryItem } from './inventory-item';
import type { ReplenishmentSuggestion } from './replenishment';
import {
	buildFunFactChipHint,
	buildHomeBriefingChipsPresentation,
	buildHomeBriefingForYouPresentation,
	buildHomeBriefingGreetingPresentation,
	buildHomeBriefingStatusPresentation,
	buildShoppingChipHint
} from './home-briefing-presenter';
import { selectHomeBriefingFunFact } from './home-briefing';

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

const morning = new Date('2026-06-19T08:00:00');
const evening = new Date('2026-06-19T20:00:00');

describe('home-briefing-presenter', () => {
	it('builds time-of-day greeting with and without display name', () => {
		expect(buildHomeBriefingGreetingPresentation('Anna', morning)).toEqual({
			key: 'home.greetingMorning',
			params: { name: 'Anna' }
		});
		expect(buildHomeBriefingGreetingPresentation('  ', evening).key).toBe(
			'home.dashboard.greetingEveningOnly'
		);
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

	it('builds shopping chip hint with weekday, never store name', () => {
		const hint = buildShoppingChipHint(
			3,
			{ weekday: 5, storeLabel: 'ICA', tripCount: 4 },
			'sv'
		);
		expect(hint.key).toBe('home.v6.chips.shoppingHint');
		expect(hint.params.count).toBe(3);
		expect(hint.params.weekday).toBeTruthy();
		expect(JSON.stringify(hint.params)).not.toContain('ICA');
	});

	it('builds four briefing chips in order, skipping eat without recipe', () => {
		const chips = buildHomeBriefingChipsPresentation({
			shoppingListCount: 2,
			shoppingCadence: { weekday: 5, storeLabel: 'ICA', tripCount: 2 },
			locale: 'sv',
			zoneCounts: { fridge: 12, freezer: 3, cupboard: 8 },
			recipeChip: null,
			funFact: { kind: 'zeroWaste', value: 2 }
		});
		expect(chips.map((chip) => chip.id)).toEqual(['shopping', 'storage', 'funFact']);
		expect(chips[1].zoneCounts).toEqual({ fridge: 12, freezer: 3, cupboard: 8 });
	});

	it('includes eat chip when recipe is available', () => {
		const chips = buildHomeBriefingChipsPresentation({
			shoppingListCount: 1,
			shoppingCadence: null,
			locale: 'en',
			zoneCounts: { fridge: 0, freezer: 0, cupboard: 0 },
			recipeChip: { id: 'idea-1', title: 'Pasta primavera' },
			funFact: null
		});
		expect(chips.map((chip) => chip.id)).toEqual(['shopping', 'storage', 'eat', 'funFact']);
	});

	it('selects fun fact from impact stats', () => {
		expect(
			selectHomeBriefingFunFact({ zeroWasteWeeks: 3, consumedThisWeek: 5 })
		).toEqual({ kind: 'zeroWaste', value: 3 });
		expect(buildFunFactChipHint({ kind: 'consumedThisWeek', value: 4 }).key).toBe(
			'home.v6.chips.funFactConsumed'
		);
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
