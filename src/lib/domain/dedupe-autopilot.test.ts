import { describe, expect, it } from 'vitest';
import { detectDedupeWarningsForKey, detectDedupeWarningsForKeys } from './dedupe-autopilot';
import { normalizeReceiptProductName } from './purchase-pattern';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { ReceiptPurchaseLineRecord } from '$lib/domain/purchase-pattern';

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

function line(
	overrides: Partial<ReceiptPurchaseLineRecord> & Pick<ReceiptPurchaseLineRecord, 'normalizedKey'>
): ReceiptPurchaseLineRecord {
	return {
		id: overrides.id ?? 'line-1',
		householdId: overrides.householdId ?? 'hh-1',
		userId: overrides.userId ?? 'user-1',
		importBatchId: overrides.importBatchId ?? 'batch-1',
		productName: overrides.productName ?? 'Beans',
		normalizedKey: overrides.normalizedKey,
		barcode: overrides.barcode ?? null,
		location: overrides.location ?? 'cupboard',
		quantity: overrides.quantity ?? '1',
		unit: overrides.unit ?? null,
		unitPrice: overrides.unitPrice ?? null,
		currency: overrides.currency ?? null,
		lineTotal: overrides.lineTotal ?? null,
		storeLabel: overrides.storeLabel ?? null,
		purchasedAt: overrides.purchasedAt ?? null,
		inventoryItemId: overrides.inventoryItemId ?? null,
		conceptKey: overrides.conceptKey ?? overrides.normalizedKey,
		matchSource: overrides.matchSource ?? null,
		importSource: overrides.importSource ?? 'unknown',
		lineIndex: overrides.lineIndex ?? 0,
		createdAt: overrides.createdAt ?? new Date('2026-06-01T12:00:00Z')
	};
}

describe('dedupe-autopilot', () => {
	const now = new Date('2026-06-12T12:00:00Z');

	it('detects overstock when multiple rows share a key', () => {
		const warnings = detectDedupeWarningsForKey('beans', {
			activeItems: [
				item({ id: 'a', name: 'Beans' }),
				item({ id: 'b', name: 'Beans' }),
				item({ id: 'c', name: 'Beans' })
			],
			recentLines: [],
			listNormalizedNames: new Set(),
			referenceDate: now
		});

		expect(warnings.some((entry) => entry.kind === 'overstock')).toBe(true);
	});

	it('detects recent purchase while item remains in pantry', () => {
		const normalizedKey = normalizeReceiptProductName('Mjölk 1L');
		const warnings = detectDedupeWarningsForKey(normalizedKey, {
			activeItems: [item({ name: 'Mjölk 1L' })],
			recentLines: [
				line({
					normalizedKey,
					productName: 'Mjölk 1L',
					purchasedAt: new Date('2026-06-10T12:00:00Z')
				})
			],
			listNormalizedNames: new Set(),
			referenceDate: now
		});

		expect(warnings.some((entry) => entry.kind === 'recent_purchase')).toBe(true);
	});

	it('detects on-list warning without blocking key batching', () => {
		const byKey = detectDedupeWarningsForKeys(['pasta'], {
			activeItems: [],
			recentLines: [],
			listNormalizedNames: new Set(['pasta']),
			referenceDate: now
		});

		expect(byKey.pasta?.some((entry) => entry.kind === 'on_list')).toBe(true);
	});
});
