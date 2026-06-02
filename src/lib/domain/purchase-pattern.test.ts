import { describe, expect, it } from 'vitest';
import {
	detectReceiptPatternSuggestions,
	normalizeReceiptProductName,
	type ReceiptPurchaseLineRecord
} from './purchase-pattern';

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
		createdAt: overrides.createdAt ?? new Date('2026-05-01T12:00:00Z')
	};
}

describe('normalizeReceiptProductName', () => {
	it('lowercases and strips punctuation', () => {
		expect(normalizeReceiptProductName('  Arla Mjölk!  ')).toBe('arla mjölk');
	});

	it('removes trailing pack size tokens', () => {
		expect(normalizeReceiptProductName('Greek yoghurt 500g')).toBe('greek yoghurt');
	});
});

describe('detectReceiptPatternSuggestions', () => {
	const now = new Date('2026-06-01T12:00:00Z');

	it('returns recurring products across imports', () => {
		const lines = [
			line({
				normalizedKey: 'mjolk',
				importBatchId: 'batch-1',
				productName: 'Mjölk 1L',
				createdAt: new Date('2026-05-10T12:00:00Z')
			}),
			line({
				id: 'line-2',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-2',
				productName: 'Mjölk 1L',
				createdAt: new Date('2026-05-20T12:00:00Z')
			}),
			line({
				id: 'line-3',
				normalizedKey: 'brod',
				importBatchId: 'batch-1',
				productName: 'Limpa',
				location: 'cupboard'
			})
		];

		const suggestions = detectReceiptPatternSuggestions(lines, new Set(), new Set(), now);
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0]).toMatchObject({
			normalizedKey: 'mjolk',
			displayName: 'Mjölk 1L',
			importCount: 2
		});
	});

	it('excludes items already in inventory or dismissed', () => {
		const lines = [
			line({ normalizedKey: 'mjolk', importBatchId: 'batch-1' }),
			line({ id: 'line-2', normalizedKey: 'mjolk', importBatchId: 'batch-2' }),
			line({ id: 'line-3', normalizedKey: 'agg', importBatchId: 'batch-1', productName: 'Ägg 12st' }),
			line({ id: 'line-4', normalizedKey: 'agg', importBatchId: 'batch-2', productName: 'Ägg 12st' })
		];

		const suggestions = detectReceiptPatternSuggestions(
			lines,
			new Set(['mjolk']),
			new Set(['agg']),
			now
		);
		expect(suggestions).toHaveLength(0);
	});

	it('requires minimum imports or line count', () => {
		const lines = [line({ normalizedKey: 'solo', importBatchId: 'batch-1' })];
		expect(detectReceiptPatternSuggestions(lines, new Set(), new Set(), now)).toHaveLength(0);
	});
});
