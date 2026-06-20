import { describe, expect, it } from 'vitest';
import { detectPantryHealthInsights } from './pantry-health';
import type { InventoryItem } from './inventory-item';

function item(overrides: Partial<InventoryItem> & Pick<InventoryItem, 'name'>): InventoryItem {
	return {
		id: overrides.id ?? 'item-1',
		householdId: overrides.householdId ?? 'hh-1',
		userId: overrides.userId ?? 'user-1',
		location: overrides.location ?? 'fridge',
		quantity: overrides.quantity ?? '1',
		unit: overrides.unit ?? null,
		expiresOn: overrides.expiresOn ?? null,
		expiresOnSource: overrides.expiresOnSource ?? null,
		notes: overrides.notes ?? null,
		barcode: overrides.barcode ?? null,
		lastConfirmedAt: overrides.lastConfirmedAt ?? new Date('2026-01-01T12:00:00Z'),
		createdAt: overrides.createdAt ?? new Date('2026-01-01T12:00:00Z'),
		updatedAt: overrides.updatedAt ?? new Date('2026-01-01T12:00:00Z'),
		name: overrides.name
	};
}

describe('detectPantryHealthInsights', () => {
	const now = new Date('2026-06-01T12:00:00Z');

	it('detects stale undated items', () => {
		const insights = detectPantryHealthInsights(
			[
				item({
					name: 'Old rice',
					expiresOn: null,
					lastConfirmedAt: new Date('2025-01-01T12:00:00Z')
				})
			],
			now
		);

		expect(insights).toHaveLength(1);
		expect(insights[0]).toMatchObject({ kind: 'stale', count: 1, href: '/inventory/synk' });
	});

	it('detects duplicate rows with the same normalized name', () => {
		const insights = detectPantryHealthInsights(
			[
				item({ id: 'a', name: 'Beans' }),
				item({ id: 'b', name: 'beans' })
			],
			now
		);

		const duplicate = insights.find((entry) => entry.kind === 'duplicate');
		expect(duplicate).toMatchObject({ count: 2, href: '/inventory/merge' });
	});

	it('detects overstock from high quantity', () => {
		const insights = detectPantryHealthInsights(
			[item({ name: 'Pasta', quantity: '12' })],
			now
		);

		const overstock = insights.find((entry) => entry.kind === 'overstock');
		expect(overstock).toMatchObject({ count: 1, displayName: 'Pasta' });
	});

	it('detects overstock from multiple rows of the same product', () => {
		const insights = detectPantryHealthInsights(
			[
				item({ id: 'a', name: 'Beans' }),
				item({ id: 'b', name: 'beans' }),
				item({ id: 'c', name: 'Beans' })
			],
			now
		);

		const duplicate = insights.find((entry) => entry.kind === 'duplicate');
		expect(duplicate).toMatchObject({ kind: 'duplicate', count: 3 });
	});

	it('caps insights at five', () => {
		const items = Array.from({ length: 8 }, (_, index) =>
			item({
				id: `dup-${index}`,
				name: `Product ${index}`,
				location: 'fridge'
			})
		);
		items.push(
			item({
				id: 'dup-a',
				name: 'Same',
				location: 'fridge'
			}),
			item({
				id: 'dup-b',
				name: 'same',
				location: 'fridge'
			})
		);

		expect(detectPantryHealthInsights(items, now).length).toBeLessThanOrEqual(5);
	});

	it('ignores finished items', () => {
		const insights = detectPantryHealthInsights(
			[item({ name: 'Empty jar', quantity: '0' })],
			now
		);
		expect(insights).toHaveLength(0);
	});
});
