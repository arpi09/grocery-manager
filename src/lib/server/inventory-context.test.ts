import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	formatInventoryLines,
	formatStructuredInventoryPayload,
	formatUrgentInventoryBlock,
	sortInventoryByUrgency
} from './inventory-context';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: '1',
		householdId: 'h1',
		userId: 'u1',
		name: 'Mjölk',
		location: 'fridge',
		quantity: '1',
		unit: 'l',
		expiresOn: '2026-06-01',
		expiresOnSource: 'household_learned',
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

describe('formatInventoryLines', () => {
	it('is locale-aware and includes id and expiry metadata', () => {
		const sv = formatInventoryLines([makeItem({ id: 'inv-1' })], 'sv');
		expect(sv).toContain('[inv-1]');
		expect(sv).toContain('utgår');
		expect(sv).toContain('household_learned');

		const en = formatInventoryLines([makeItem({ id: 'inv-1' })], 'en');
		expect(en).toContain('expires');
	});
});

describe('formatStructuredInventoryPayload', () => {
	it('caps and sorts by urgency', () => {
		const items = [
			makeItem({ id: 'late', name: 'Late', expiresOn: '2026-08-01' }),
			makeItem({ id: 'soon', name: 'Soon', expiresOn: '2026-06-02' })
		];
		const sorted = sortInventoryByUrgency(items);
		expect(sorted[0]?.id).toBe('soon');

		const payload = formatStructuredInventoryPayload(items, 'sv', { cap: 1 });
		expect(payload.inventory).toHaveLength(1);
		expect(payload.omittedCount).toBe(1);
	});
});

describe('formatUrgentInventoryBlock', () => {
	it('returns placeholder when nothing urgent', () => {
		expect(formatUrgentInventoryBlock([], 'sv')).toContain('inga varor');
	});
});
