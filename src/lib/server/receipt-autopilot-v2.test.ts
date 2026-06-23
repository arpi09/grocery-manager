import { describe, expect, it } from 'vitest';
import {
	partitionReceiptLinesForAutopilotV2,
	RECEIPT_AUTOPILOT_V2_CONFIDENCE_MIN,
	selectReceiptAutopilotV2Lines
} from '$lib/server/receipt-autopilot-v2';
import type { ReceiptLine } from '$lib/domain/receipt-line';

describe('receipt-autopilot-v2', () => {
	const ctx = {
		shelfLifeRules: [
			{
				householdId: 'h1',
				normalizedKey: 'mjölk',
				location: 'fridge' as const,
				typicalDays: 9,
				sampleCount: 3,
				lastPredictedDays: 9,
				updatedAt: new Date()
			}
		],
		locationRules: []
	};

	it('selects high-confidence lines with learned shelf-life rule', () => {
		const lines: ReceiptLine[] = [
			{ name: 'Mjölk', quantity: '1', unit: 'l', location: 'fridge', confidence: 0.95 },
			{ name: 'Bröd', quantity: '1', unit: 'st', location: 'cupboard', confidence: 0.5 }
		];

		const selected = selectReceiptAutopilotV2Lines(lines, [null, null], ctx);
		expect(selected).toHaveLength(1);
		expect(selected[0].normalizedKey).toBe('mjölk');
		expect(selected[0].index).toBe(0);
	});

	it('partitions lines into auto-import and review buckets', () => {
		const lines: ReceiptLine[] = [
			{ name: 'Mjölk', quantity: '1', unit: 'l', location: 'fridge', confidence: 0.95 },
			{ name: 'Bröd', quantity: '1', unit: 'st', location: 'cupboard', confidence: 0.95 }
		];

		const { autoImport, review, autoImportIndices } = partitionReceiptLinesForAutopilotV2(
			lines,
			[null, null],
			ctx
		);

		expect(autoImport).toHaveLength(1);
		expect(review).toHaveLength(1);
		expect(autoImportIndices).toEqual([0]);
	});

	it('uses confidence threshold constant', () => {
		expect(RECEIPT_AUTOPILOT_V2_CONFIDENCE_MIN).toBe(0.9);
	});
});
