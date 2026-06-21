import { describe, expect, it, vi } from 'vitest';
import type { PmfService } from '$lib/application/pmf.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import {
	countLinesWithPrice,
	importReceiptLines,
	recordReceiptPriceCapturedEvent
} from './receipt-import';
import { parseOptionalPriceField } from './receipt-import-purchase';

const recordProductEvent = vi.fn();

vi.mock('$lib/server/product-events', () => ({
	recordProductEvent: (...args: unknown[]) => recordProductEvent(...args)
}));

vi.mock('$lib/server/shelf-life-learning-flag', () => ({
	isShelfLifeLearningEnabled: () => false
}));

vi.mock('$lib/server/location-learning-flag', () => ({
	isLocationLearningEnabled: () => false
}));

function createInventoryService(): InventoryService {
	return {
		createItem: vi.fn(async () => ({ id: 'item-1' }))
	} as unknown as InventoryService;
}

function createPurchasePatternService(): PurchasePatternService {
	return {
		recordReceiptImport: vi.fn(async () => undefined)
	} as unknown as PurchasePatternService;
}

describe('countLinesWithPrice', () => {
	it('counts lines with non-empty unitPrice', () => {
		expect(
			countLinesWithPrice([
				{ unitPrice: '12.90' },
				{ unitPrice: '  ' },
				{ unitPrice: undefined },
				{ unitPrice: '8.50' }
			])
		).toEqual({ linesWithPrice: 2, totalLines: 4 });
	});
});

describe('recordReceiptPriceCapturedEvent', () => {
	it('fires receipt_price_captured with counts', () => {
		recordProductEvent.mockClear();
		const pmfService = {} as PmfService;

		recordReceiptPriceCapturedEvent(pmfService, {
			userId: 'user-1',
			householdId: 'household-1',
			linesWithPrice: 2,
			totalLines: 3,
			source: 'manual'
		});

		expect(recordProductEvent).toHaveBeenCalledWith(pmfService, {
			userId: 'user-1',
			householdId: 'household-1',
			eventType: 'receipt_price_captured',
			metadata: { linesWithPrice: 2, totalLines: 3, source: 'manual' }
		});
	});

	it('skips when totalLines is zero', () => {
		recordProductEvent.mockClear();
		recordReceiptPriceCapturedEvent({} as PmfService, {
			userId: 'user-1',
			householdId: 'household-1',
			linesWithPrice: 0,
			totalLines: 0
		});
		expect(recordProductEvent).not.toHaveBeenCalled();
	});
});

describe('importReceiptLines', () => {
	it('returns linesWithPrice and emits receipt_price_captured', async () => {
		recordProductEvent.mockClear();
		const pmfService = {} as PmfService;
		const inventoryService = createInventoryService();
		const purchasePatternService = createPurchasePatternService();

		const result = await importReceiptLines({
			householdId: 'household-1',
			userId: 'user-1',
			role: 'owner',
			lines: [
				{ name: 'MjÃ¶lk', location: 'fridge', unitPrice: '15.90' },
				{ name: 'BrÃ¶d', location: 'cupboard' }
			],
			inventoryService,
			purchasePatternService,
			pmfService,
			learningEngineService: {} as LearningEngineService,
			eventType: 'receipt_parsed',
			source: 'manual'
		});

		expect(result).toMatchObject({ itemsAdded: 2, linesWithPrice: 1, totalLines: 2 });
		expect(recordProductEvent).toHaveBeenCalledWith(
			pmfService,
			expect.objectContaining({
				eventType: 'receipt_price_captured',
				metadata: { linesWithPrice: 1, totalLines: 2, source: 'manual' }
			})
		);
	});
});

	it('maps receipt lines into purchase import records', async () => {
		recordProductEvent.mockClear();
		const pmfService = {} as PmfService;
		const inventoryService = createInventoryService();
		const recordReceiptImport = vi.fn(async () => undefined);
		const purchasePatternService = {
			recordReceiptImport
		} as unknown as PurchasePatternService;

		await importReceiptLines({
			householdId: 'household-1',
			userId: 'user-1',
			role: 'owner',
			lines: [{ name: 'Mjolk', location: 'fridge', unitPrice: '15.90', currency: 'SEK' }],
			inventoryService,
			purchasePatternService,
			pmfService,
			learningEngineService: {} as LearningEngineService,
			eventType: 'receipt_parsed',
			source: 'manual',
			storeLabel: 'ICA',
			purchasedAt: '2026-06-02'
		});

		expect(recordReceiptImport).toHaveBeenCalledWith([
			expect.objectContaining({
				productName: 'Mjolk',
				location: 'fridge',
				unitPrice: '15.90',
				currency: 'SEK',
				storeLabel: 'ICA',
				importSource: 'receipt_scan',
				matchSource: 'inventory_item',
				inventoryItemId: 'item-1'
			})
		]);
	});

describe('parseOptionalPriceField', () => {
	it('strips Swedish currency suffix before parsing', () => {
		expect(parseOptionalPriceField('12,90 kr')).toBe('12.90');
		expect(parseOptionalPriceField('8.50 SEK')).toBe('8.50');
		expect(parseOptionalPriceField('19:-')).toBe('19.00');
	});

	it('returns null for non-numeric strings', () => {
		expect(parseOptionalPriceField('gratis')).toBeNull();
	});
});
