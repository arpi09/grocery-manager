import { describe, expect, it } from 'vitest';
import {
	buildGlobalCorrectedFewShotBlock,
	buildPriorCorrectionsBlock,
	type GlobalCorrectedProduct,
	type PriorCorrectionRow
} from './receipt-parse-feedback';

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
