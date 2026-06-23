import { describe, expect, it } from 'vitest';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import { countLowLineConfidence, shouldReparsedForLowQuality } from './receipt-parse';

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
