import { describe, expect, it } from 'vitest';
import {
	detectReceiptFinishSuggestions,
	detectReceiptPatternSuggestions,
	normalizeReceiptProductName,
	receiptFinishDismissKey,
	type ReceiptPurchaseLineRecord
} from './purchase-pattern';

const MJOLK = 'Mj\u00F6lk';
const AGG = '\u00E4gg';

function line(
	overrides: Partial<ReceiptPurchaseLineRecord> & Pick<ReceiptPurchaseLineRecord, 'normalizedKey'>
): ReceiptPurchaseLineRecord {
	return {
		id: overrides.id ?? 'line-1',
		householdId: overrides.householdId ?? 'hh-1',
		userId: overrides.userId ?? 'user-1',
		importBatchId: overrides.importBatchId ?? 'batch-1',
		productName: overrides.productName ?? `${MJOLK} 1L`,
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

describe('normalizeReceiptProductName', () => {
	it('lowercases, strips punctuation and brand prefixes', () => {
		expect(normalizeReceiptProductName(`  Arla ${MJOLK}!  `)).toBe(MJOLK.toLowerCase());
	});

	it('strips fryst/färsk/eko prefixes for merge', () => {
		expect(normalizeReceiptProductName('Fryst kycklingfilé')).toBe('kycklingfilé');
		expect(normalizeReceiptProductName('Eko bananer')).toBe('bananer');
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
				productName: `${MJOLK} 1L`,
				createdAt: new Date('2026-05-10T12:00:00Z')
			}),
			line({
				id: 'line-2',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-2',
				productName: `${MJOLK} 1L`,
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
			displayName: `${MJOLK} 1L`,
			importCount: 2
		});
	});

	it('excludes items already in inventory or dismissed', () => {
		const lines = [
			line({ normalizedKey: 'mjolk', importBatchId: 'batch-1' }),
			line({ id: 'line-2', normalizedKey: 'mjolk', importBatchId: 'batch-2' }),
			line({ id: 'line-3', normalizedKey: 'agg', importBatchId: 'batch-1', productName: `${AGG} 12st` }),
			line({ id: 'line-4', normalizedKey: 'agg', importBatchId: 'batch-2', productName: `${AGG} 12st` })
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

	it('uses purchasedAt over createdAt for cutoff and lastPurchasedAt', () => {
		const lines = [
			line({
				normalizedKey: 'mjolk',
				importBatchId: 'batch-1',
				purchasedAt: new Date('2026-05-10T12:00:00Z'),
				createdAt: new Date('2026-05-25T12:00:00Z')
			}),
			line({
				id: 'line-2',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-2',
				purchasedAt: new Date('2026-05-20T12:00:00Z'),
				createdAt: new Date('2026-05-28T12:00:00Z')
			}),
			line({
				id: 'line-3',
				normalizedKey: 'mjolk',
				importBatchId: 'batch-3',
				purchasedAt: new Date('2026-02-01T12:00:00Z'),
				createdAt: new Date('2026-05-29T12:00:00Z')
			})
		];

		const suggestions = detectReceiptPatternSuggestions(lines, new Set(), new Set(), now);
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0].lastPurchasedAt).toEqual(new Date('2026-05-20T12:00:00Z'));
		expect(suggestions[0].lineCount).toBe(2);
	});
});

describe('detectReceiptFinishSuggestions', () => {
	const now = new Date('2026-06-01T12:00:00Z');

	it('suggests finishing pantry stock when the same product was bought again', () => {
		const lines = [
			line({
				normalizedKey: 'mjolk',
				productName: `${MJOLK} 1L`,
				createdAt: new Date('2026-05-28T12:00:00Z')
			})
		];
		const inventory = [
			{
				id: 'inv-1',
				name: MJOLK,
				location: 'fridge' as const,
				quantity: '1',
				unit: 'L',
				normalizedKey: 'mjolk'
			}
		];

		const suggestions = detectReceiptFinishSuggestions(lines, inventory, new Set(), now);
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0]).toMatchObject({
			inventoryItemId: 'inv-1',
			displayName: MJOLK,
			purchasedName: `${MJOLK} 1L`
		});
	});

	it('respects finish dismissals', () => {
		const lines = [line({ normalizedKey: 'mjolk', createdAt: new Date('2026-05-28T12:00:00Z') })];
		const inventory = [
			{
				id: 'inv-1',
				name: MJOLK,
				location: 'fridge' as const,
				quantity: '1',
				unit: null,
				normalizedKey: 'mjolk'
			}
		];

		const dismissed = new Set([receiptFinishDismissKey('inv-1')]);
		expect(detectReceiptFinishSuggestions(lines, inventory, dismissed, now)).toHaveLength(0);
	});
});
