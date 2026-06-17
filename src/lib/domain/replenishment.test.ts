import { describe, expect, it } from 'vitest';
import {
	computeAverageCadenceDays,
	computeDaysSinceLast,
	detectReplenishmentSuggestions
} from './replenishment';
import type { ReceiptPurchaseLineRecord } from './purchase-pattern';

function line(
	overrides: Partial<ReceiptPurchaseLineRecord> & Pick<ReceiptPurchaseLineRecord, 'normalizedKey'>
): ReceiptPurchaseLineRecord {
	return {
		id: overrides.id ?? 'line-1',
		householdId: overrides.householdId ?? 'hh-1',
		userId: overrides.userId ?? 'user-1',
		importBatchId: overrides.importBatchId ?? 'batch-1',
		productName: overrides.productName ?? 'Mjölk 1L',
		normalizedKey: overrides.normalizedKey,
		barcode: overrides.barcode ?? null,
		location: overrides.location ?? 'fridge',
		quantity: overrides.quantity ?? '1',
		unit: overrides.unit ?? 'L',
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
		createdAt: overrides.createdAt ?? new Date('2026-05-01T12:00:00Z')
	};
}

describe('computeAverageCadenceDays', () => {
	it('returns null with fewer than 3 events', () => {
		expect(
			computeAverageCadenceDays([
				new Date('2026-05-01T12:00:00Z'),
				new Date('2026-05-08T12:00:00Z')
			])
		).toBeNull();
	});

	it('computes mean gap between consecutive purchases', () => {
		const avg = computeAverageCadenceDays([
			new Date('2026-05-01T12:00:00Z'),
			new Date('2026-05-08T12:00:00Z'),
			new Date('2026-05-22T12:00:00Z')
		]);
		expect(avg).toBe(11);
	});
});

describe('computeDaysSinceLast', () => {
	it('measures days from latest purchase to now', () => {
		const now = new Date('2026-06-01T12:00:00Z');
		const days = computeDaysSinceLast(
			[new Date('2026-05-10T12:00:00Z'), new Date('2026-05-20T12:00:00Z')],
			now
		);
		expect(days).toBe(12);
	});
});

describe('detectReplenishmentSuggestions', () => {
	const now = new Date('2026-06-01T12:00:00Z');

	it('suggests recurring products not in pantry with reason code', () => {
		const lines = [
			line({
				normalizedKey: 'mjolk',
				importBatchId: 'batch-1',
				createdAt: new Date('2026-05-10T12:00:00Z')
			}),
			line({
				id: 'line-2',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-2',
				createdAt: new Date('2026-05-20T12:00:00Z')
			})
		];

		const suggestions = detectReplenishmentSuggestions(lines, new Set(), new Set(), new Set(), now);
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0]).toMatchObject({
			normalizedKey: 'mjolk',
			reasonCode: 'recurring_not_in_pantry'
		});
	});

	it('flags cadence-overdue when days since last purchase exceed average interval', () => {
		const lines = [
			line({
				normalizedKey: 'yoghurt',
				importBatchId: 'batch-1',
				createdAt: new Date('2026-04-01T12:00:00Z')
			}),
			line({
				id: 'line-2',
				normalizedKey: 'yoghurt',
				importBatchId: 'batch-1',
				createdAt: new Date('2026-04-08T12:00:00Z')
			}),
			line({
				id: 'line-3',
				normalizedKey: 'yoghurt',
				importBatchId: 'batch-2',
				createdAt: new Date('2026-04-15T12:00:00Z')
			}),
			line({
				id: 'line-4',
				normalizedKey: 'yoghurt',
				importBatchId: 'batch-3',
				createdAt: new Date('2026-05-01T12:00:00Z')
			})
		];

		const suggestions = detectReplenishmentSuggestions(lines, new Set(), new Set(), new Set(), now);
		expect(suggestions).toHaveLength(1);
		expect(['cadence_overdue', 'recurring_and_cadence']).toContain(suggestions[0]!.reasonCode);
		expect(suggestions[0]!.daysSinceLast).toBeGreaterThanOrEqual(
			suggestions[0]!.avgIntervalDays ?? 0
		);
	});

	it('excludes items on unchecked shopping list', () => {
		const lines = [
			line({ normalizedKey: 'mjolk', importBatchId: 'batch-1' }),
			line({ id: 'line-2', normalizedKey: 'mjolk', importBatchId: 'batch-2' })
		];

		const suggestions = detectReplenishmentSuggestions(
			lines,
			new Set(),
			new Set(['mjolk']),
			new Set(),
			now
		);
		expect(suggestions).toHaveLength(0);
	});

	it('excludes dismissed and in-pantry keys', () => {
		const lines = [
			line({ normalizedKey: 'mjolk', importBatchId: 'batch-1' }),
			line({ id: 'line-2', normalizedKey: 'mjolk', importBatchId: 'batch-2' }),
			line({ id: 'line-3', normalizedKey: 'brod', importBatchId: 'batch-1', productName: 'Limpa' }),
			line({ id: 'line-4', normalizedKey: 'brod', importBatchId: 'batch-2', productName: 'Limpa' })
		];

		const suggestions = detectReplenishmentSuggestions(
			lines,
			new Set(['mjolk']),
			new Set(),
			new Set(['brod']),
			now
		);
		expect(suggestions).toHaveLength(0);
	});

	it('prefers combined evidence in sort order', () => {
		const lines = [
			line({
				normalizedKey: 'mjolk',
				importBatchId: 'batch-1',
				createdAt: new Date('2026-04-01T12:00:00Z')
			}),
			line({
				id: 'line-2',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-2',
				createdAt: new Date('2026-04-08T12:00:00Z')
			}),
			line({
				id: 'line-3',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-3',
				createdAt: new Date('2026-04-15T12:00:00Z')
			}),
			line({
				id: 'line-4',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-4',
				createdAt: new Date('2026-05-01T12:00:00Z')
			}),
			line({
				id: 'line-5',
				normalizedKey: 'solo',
				importBatchId: 'batch-1',
				productName: 'Solo',
				createdAt: new Date('2026-05-10T12:00:00Z')
			}),
			line({
				id: 'line-6',
				normalizedKey: 'solo',
				importBatchId: 'batch-2',
				productName: 'Solo',
				createdAt: new Date('2026-05-20T12:00:00Z')
			})
		];

		const suggestions = detectReplenishmentSuggestions(lines, new Set(), new Set(), new Set(), now);
		expect(suggestions[0]!.normalizedKey).toBe('mjolk');
		expect(suggestions[0]!.reasonCode).toBe('recurring_and_cadence');
	});
});
