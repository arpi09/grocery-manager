import { describe, expect, it } from 'vitest';
import { detectWasteAlert, SLOW_MOVER_CONFIRMED_DAYS } from './waste-prevention';
import { EXPIRING_SOON_DAYS } from './expiry';
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
		lastConfirmedAt: overrides.lastConfirmedAt ?? new Date('2026-01-01T12:00:00Z'),
		createdAt: overrides.createdAt ?? new Date('2026-01-01T12:00:00Z'),
		updatedAt: overrides.updatedAt ?? new Date('2026-01-01T12:00:00Z'),
		name: overrides.name
	};
}

describe('detectWasteAlert', () => {
	const now = new Date('2026-06-01T12:00:00Z');

	it('returns null when nothing expires soon', () => {
		expect(
			detectWasteAlert(
				[item({ name: 'Rice', expiresOn: '2026-12-01' })],
				now
			)
		).toBeNull();
	});

	it('counts items expiring within the soon window', () => {
		const alert = detectWasteAlert(
			[
				item({ id: 'a', name: 'Yogurt', expiresOn: '2026-06-03' }),
				item({ id: 'b', name: 'Milk', expiresOn: '2026-06-05' }),
				item({ id: 'c', name: 'Cheese', expiresOn: '2026-12-01' })
			],
			now
		);

		expect(alert).toMatchObject({
			expiringCount: 2,
			href: '#eat-first'
		});
	});

	it('flags slow movers confirmed long ago', () => {
		const oldConfirmed = new Date(now);
		oldConfirmed.setDate(oldConfirmed.getDate() - SLOW_MOVER_CONFIRMED_DAYS - 1);

		const alert = detectWasteAlert(
			[
				item({
					name: 'Cream',
					expiresOn: '2026-06-04',
					lastConfirmedAt: oldConfirmed
				})
			],
			now
		);

		expect(alert?.slowMoverCount).toBe(1);
	});

	it('does not count slow movers when recently confirmed', () => {
		const alert = detectWasteAlert(
			[
				item({
					name: 'Cream',
					expiresOn: '2026-06-04',
					lastConfirmedAt: now
				})
			],
			now
		);

		expect(alert?.slowMoverCount).toBe(0);
	});

	it('ignores finished items', () => {
		expect(
			detectWasteAlert(
				[item({ name: 'Old milk', expiresOn: '2026-06-02', quantity: '0' })],
				now
			)
		).toBeNull();
	});

	it('includes items expiring today', () => {
		const alert = detectWasteAlert(
			[item({ name: 'Bread', expiresOn: '2026-06-01' })],
			now
		);
		expect(alert?.expiringCount).toBe(1);
	});

	it('excludes items just outside the soon window', () => {
		const expiresOn = new Date(now);
		expiresOn.setDate(expiresOn.getDate() + EXPIRING_SOON_DAYS + 1);
		const dateStr = expiresOn.toISOString().slice(0, 10);

		expect(
			detectWasteAlert([item({ name: 'Butter', expiresOn: dateStr })], now)
		).toBeNull();
	});
});
