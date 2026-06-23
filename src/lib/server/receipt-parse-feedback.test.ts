import { describe, expect, it } from 'vitest';
import {
	buildGlobalCorrectedFewShotBlock,
	buildPriorCorrectionsBlock,
	type GlobalCorrectedProduct,
	type PriorCorrectionRow
} from './receipt-parse-feedback';
import { countLowLineConfidence, shouldReparsedForLowQuality } from './receipt-parse';
import type { ReceiptLine } from '$lib/domain/receipt-line';

describe('receipt-parse-feedback blocks', () => {
	it('formats prior corrections for prompt', () => {
		const rows: PriorCorrectionRow[] = [
			{
				subjectKey: 'mjolk',
				productName: 'Mjölk',
				predictedExpiresOn: '2026-06-01',
				actualExpiresOn: '2026-06-08'
			}
		];
		const block = buildPriorCorrectionsBlock(rows);
		expect(block).toContain('Mjölk');
		expect(block).toContain('2026-06-08');
	});

	it('formats global few-shot from top corrected products', () => {
		const products: GlobalCorrectedProduct[] = [
			{ subjectKey: 'gradde', productName: 'Grädde', correctionCount: 4 }
		];
		const block = buildGlobalCorrectedFewShotBlock(products);
		expect(block).toContain('Grädde');
		expect(block).toContain('4 ggr');
	});
});

describe('shouldReparsedForLowQuality', () => {
	it('triggers when more than 30% of lines are low confidence', () => {
		const lines: ReceiptLine[] = [
			{ name: 'A', location: 'fridge', confidence: 0.2 },
			{ name: 'B', location: 'fridge', confidence: 0.9 },
			{ name: 'C', location: 'fridge', confidence: 0.1 }
		];
		expect(countLowLineConfidence(lines)).toBe(2);
		expect(shouldReparsedForLowQuality(lines)).toBe(true);
	});

	it('does not trigger when quality is acceptable', () => {
		const lines: ReceiptLine[] = [
			{ name: 'A', location: 'fridge', confidence: 0.9 },
			{ name: 'B', location: 'fridge', confidence: 0.8 }
		];
		expect(shouldReparsedForLowQuality(lines)).toBe(false);
	});
});
