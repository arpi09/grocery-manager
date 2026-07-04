import { describe, expect, it } from 'vitest';
import type { ReplenishmentSuggestion } from './replenishment';
import type { ShoppingListItem } from './shopping-list-item';
import {
	buildSundayProposal,
	SUNDAY_SUGGESTION_MAX,
	type SundayAiSuggestionInput
} from './sunday-suggestion';

function replenishment(overrides: Partial<ReplenishmentSuggestion> = {}): ReplenishmentSuggestion {
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
		daysSinceLast: 9,
		avgIntervalDays: 7,
		purchaseCount: 4,
		...overrides
	};
}

function ai(overrides: Partial<SundayAiSuggestionInput> = {}): SundayAiSuggestionInput {
	return {
		name: 'Tacokrydda',
		quantity: '1 st',
		reason: 'Till tacofredag',
		priority: 'medium',
		relatedMealDate: null,
		relatedRecipeTitle: null,
		...overrides
	};
}

function listItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
	const now = new Date('2026-07-04');
	return {
		id: 'row-1',
		householdId: 'hh',
		name: 'Bananer',
		quantity: null,
		unit: null,
		checked: false,
		unavailableAt: null,
		sortOrder: 0,
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

describe('buildSundayProposal', () => {
	it('leads with replenishment, then AI by priority', () => {
		const rows = buildSundayProposal({
			replenishment: [replenishment()],
			aiSuggestions: [
				ai({ name: 'Lök', priority: 'low', reason: 'Bra att ha hemma' }),
				ai({ name: 'Kyckling', priority: 'high', reason: 'Mjölken tar slut' })
			],
			listItems: []
		});

		expect(rows.map((r) => r.name)).toEqual(['Mjölk', 'Kyckling', 'Lök']);
		expect(rows[0].source).toBe('replenishment');
		expect(rows[0].reason).toEqual({
			kind: 'i18n',
			key: 'replenishment.reason.cadenceOverdue',
			params: { days: 9, interval: 7 }
		});
		expect(rows[1].reason).toEqual({ kind: 'text', text: 'Mjölken tar slut' });
	});

	it('carries a display quantity and the accept key for replenishment', () => {
		const [row] = buildSundayProposal({
			replenishment: [replenishment({ quantity: '1', unit: 'L' })],
			aiSuggestions: [],
			listItems: []
		});
		expect(row.quantityLabel).toBe('1 L');
		expect(row.normalizedKey).toBe('mjolk');
	});

	it('skips items already on the unchecked list', () => {
		const rows = buildSundayProposal({
			replenishment: [replenishment({ displayName: 'Mjölk' })],
			aiSuggestions: [ai({ name: 'Bananer', reason: 'Snart slut' })],
			listItems: [listItem({ name: 'bananer' }), listItem({ id: 'row-2', name: 'Mjölk' })]
		});
		expect(rows).toHaveLength(0);
	});

	it('does not double-count when AI repeats a replenishment item', () => {
		const rows = buildSundayProposal({
			replenishment: [replenishment({ displayName: 'Mjölk', normalizedKey: 'mjolk' })],
			aiSuggestions: [ai({ name: 'mjölk', reason: 'Tar slut snart' })],
			listItems: []
		});
		expect(rows).toHaveLength(1);
		expect(rows[0].source).toBe('replenishment');
	});

	it('ignores AI rows without a reason (60% principle — no bare guesses)', () => {
		const rows = buildSundayProposal({
			replenishment: [],
			aiSuggestions: [ai({ name: 'Gurka', reason: '   ' })],
			listItems: []
		});
		expect(rows).toHaveLength(0);
	});

	it('caps the fused proposal at the max', () => {
		const rows = buildSundayProposal({
			replenishment: Array.from({ length: 8 }, (_, i) =>
				replenishment({ normalizedKey: `r-${i}`, displayName: `Repl ${i}` })
			),
			aiSuggestions: Array.from({ length: 8 }, (_, i) =>
				ai({ name: `Ai ${i}`, reason: `Skäl ${i}` })
			),
			listItems: []
		});
		expect(rows).toHaveLength(SUNDAY_SUGGESTION_MAX);
		// Replenishment fills first, AI takes the remaining slots.
		expect(rows.slice(0, 8).every((r) => r.source === 'replenishment')).toBe(true);
		expect(rows.slice(8).every((r) => r.source === 'ai')).toBe(true);
	});

	it('degrades to AI-only when there is no replenishment data', () => {
		const rows = buildSundayProposal({
			replenishment: [],
			aiSuggestions: [ai({ name: 'Ägg', reason: 'Till helgfrukosten', priority: 'high' })],
			listItems: []
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ source: 'ai', name: 'Ägg' });
	});

	it('returns nothing when both streams are empty', () => {
		expect(
			buildSundayProposal({ replenishment: [], aiSuggestions: [], listItems: [] })
		).toEqual([]);
	});
});
